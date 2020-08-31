from generator import Generator
import json


JSON_FILE = "src/static/audios.js"
SQL_FILE = "scripts/data.db"


def run():
    g = Generator(SQL_FILE)
    g.sync(True)

    audios_list = g.load()
    with open(JSON_FILE, "w") as f:

        f.write("const activities = ")
        json.dump(audios_list, f, indent=2)
        f.write(";\n")
        f.write("\n")
        f.write("export { activities };\n")


if __name__ == "__main__":
    run()