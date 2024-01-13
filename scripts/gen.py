from generator import Generator
import json

AVATAR_PATH = "src/images/"
JSON_FILE = "src/static/audios.js"
SQL_FILE = "scripts/data.db"


def run():
    g = Generator(SQL_FILE, AVATAR_PATH)
    # if you want host your won change False -> True
    g.sync(False)
    ############# if you want host by your own, un comment below two lines #################
    # g.add_missing_duration()
    g.add_missing_djs_icon()

    audios_list, djs_list = g.load()
    with open(JSON_FILE, "w") as f:

        f.write("const activities = ")
        json.dump(audios_list, f, indent=2)
        f.write(";\n")
        f.write("\n")
        f.write("const djs = ")
        json.dump(djs_list, f, indent=2)
        f.write(";\n")
        f.write("\n")
        f.write("export { activities, djs };\n")


if __name__ == "__main__":
    run()
