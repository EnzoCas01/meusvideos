import json

d = json.load(open("/root/meusvideos/out/eslint-rc.json"))
for f in d:
    if f["errorCount"]:
        print(f["filePath"].split("/")[-1], [(m["ruleId"], m["line"]) for m in f["messages"]])
