from generator import Generator
import json

AVATAR_PATH = "src/images/"
JSON_FILE = "src/static/audios.js"
SQL_FILE = "scripts/data.db"


def run():
    g = Generator(SQL_FILE, AVATAR_PATH)
    g.sync(False)

    audios_list, djs_list = g.load()
    with open(JSON_FILE, "w") as f:

        f.write("const activities = ")
        json.dump(audios_list, f, indent=2)
        f.write(";\n")
        f.write("\n")
        f.write("const djs = ")
        json.dump(djs_list, f,  indent=2)
        f.write(";\n")
        f.write("\n")
        f.write("export { activities, djs };\n")


if __name__ == "__main__":
    run()