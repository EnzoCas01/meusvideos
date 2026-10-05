#!/usr/bin/env python3
"""Cadastra credenciais da API oficial do Instagram por projeto, fora do Git."""

import argparse
import getpass
import json
import os
import re
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

STORE = Path(os.environ.get("MEUSVIDEOS_INSTAGRAM_DIR", "/root/documentos/operacao/meusvideos/instagram"))
SLUG = re.compile(r"[a-z0-9][a-z0-9_-]{0,63}\Z")


def profile_path(project):
    if not SLUG.fullmatch(project):
        raise ValueError("use um nome de projeto com letras minúsculas, números, - ou _")
    return STORE / f"{project}.json"


def save_profile(target, data):
    if STORE.is_symlink() or target.is_symlink():
        raise ValueError("a pasta e o cadastro não podem ser links simbólicos")
    STORE.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(STORE, 0o700)
    fd, temp = tempfile.mkstemp(prefix=f".{target.stem}-", dir=STORE)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp, target)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def add(args):
    project = args.project or input("Nome curto do projeto (ex.: minha-marca): ").strip()
    target = profile_path(project)
    if STORE.is_symlink():
        raise ValueError("a pasta de credenciais não pode ser um link simbólico")
    if target.is_symlink():
        raise ValueError("o cadastro do projeto não pode ser um link simbólico")
    if target.exists() and input(f"{project} já existe. Substituir a credencial? [s/N] ").strip().lower() != "s":
        print("Cadastro mantido.")
        return
    account_id = input("ID numérico da conta profissional do Instagram (Enter se não souber): ").strip()
    if account_id and (not account_id.isascii() or not account_id.isdecimal()):
        raise ValueError("o ID da conta deve conter apenas números")
    token = getpass.getpass("Token de acesso (entrada oculta): ").strip()
    if not token or any(c.isspace() for c in token):
        raise ValueError("o token deve ser preenchido e não pode conter espaços")
    data = {
        "project": project,
        "provider": args.provider,
        "ig_user_id": account_id,
        "access_token": token,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    save_profile(target, data)
    print(f"Credencial de '{project}' salva em {target} (permissão 600).")
    if not account_id:
        print("Falta o ID da conta para publicar. Rode o mesmo comando depois para completar o cadastro.")


def check(args):
    target = profile_path(args.project)
    if target.is_symlink() or not target.is_file():
        raise ValueError("projeto não cadastrado")
    data = json.loads(target.read_text(encoding="utf-8"))
    token = data.get("access_token")
    if not token:
        raise ValueError("o projeto não tem token")
    if data.get("provider") == "instagram_login":
        url = "https://graph.instagram.com/me?fields=id,user_id,username,account_type"
    elif data.get("provider") == "facebook_login" and str(data.get("ig_user_id", "")).isdecimal():
        url = f"https://graph.facebook.com/{data['ig_user_id']}?fields=id,username,account_type"
    else:
        raise ValueError("tipo de API ou ID da conta inválido")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            profile = json.load(response)
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode()).get("error", {})
        except ValueError:
            err = {}
        raise ValueError(f"Meta respondeu HTTP {e.code} (código {err.get('code', '?')}, subcódigo {err.get('error_subcode', '?')})") from None
    except urllib.error.URLError as e:
        raise ValueError(f"falha de rede ({type(e.reason).__name__})") from None
    account_id = str(profile.get("user_id") or profile.get("id") or "")
    if not account_id.isdecimal() or not profile.get("username"):
        raise ValueError("a Meta não devolveu um perfil profissional identificável")
    changed = data.get("ig_user_id") != account_id
    data.update(ig_user_id=account_id, username=profile["username"], account_type=profile.get("account_type"),
                verified_at=datetime.now(timezone.utc).isoformat())
    save_profile(target, data)
    print(f"Conexão válida: @{profile['username']} ({profile.get('account_type') or 'tipo não informado'}).")
    if changed:
        print("ID da conta corrigido com o valor retornado pela Meta.")
    print("A leitura do perfil foi validada; a permissão de publicação ainda não foi testada.")


def list_profiles(_args):
    if not STORE.exists():
        print("Nenhum projeto cadastrado.")
        return
    for f in sorted(STORE.glob("*.json")):
        if not SLUG.fullmatch(f.stem) or f.is_symlink():
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        ready = "perfil validado" if data.get("verified_at") else "token + ID" if data.get("access_token") and data.get("ig_user_id") else "falta ID da conta"
        print(f"{f.stem}\t{data.get('provider', '?')}\t{ready}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p_add = sub.add_parser("add", help="cadastra ou atualiza a credencial de um projeto")
    p_add.add_argument("project", nargs="?", help="nome curto do projeto, ex.: minha-marca (se omitido, será perguntado)")
    p_add.add_argument("--provider", choices=("instagram_login", "facebook_login"), default="instagram_login",
                       help="tipo do token da API oficial da Meta")
    p_check = sub.add_parser("check", help="valida token e conta na Meta sem publicar")
    p_check.add_argument("project", help="nome curto do projeto cadastrado")
    sub.add_parser("list", help="lista projetos sem mostrar tokens")
    args = parser.parse_args()
    try:
        {"add": add, "check": check, "list": list_profiles}[args.command](args)
    except (OSError, ValueError) as e:
        parser.exit(1, f"Erro: {e}\n")


if __name__ == "__main__":
    main()
