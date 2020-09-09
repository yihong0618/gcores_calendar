"""Create a poster from track data."""
# Copyright 2016-2019 Florian Pigorsch & Contributors. All rights reserved.
#
# Use of this source code is governed by a MIT-style
# license that can be found in the LICENSE file.

from collections import defaultdict
import datetime
import svgwrite
from value_range import ValueRange
from xy import XY


class Poster:

    def __init__(self):
        self.athlete = None
        self.title = None
        self.tracks_by_date = {}
        self.tracks = []
        self.length_range = None
        self.length_range_by_date = None
        self.units = "metric"
        self.colors = {
            "background": "#222222",
            "text": "#FFFFFF",
            "special": "#FFFF00",
            "track": "#4DD2FF",
        }
        self.special_likes = {"special_likes1": "10", "special_likes2": "20"}
        self.width = 200
        self.height = 300
        self.years = set()
        self.tracks_drawer = None
        self.trans = None

    def set_tracks(self, tracks):
        self.tracks = tracks
        self.tracks_by_date = {}
        self.length_range = ValueRange()
        self.length_range_by_date = ValueRange()
        self.__compute_years(tracks)
        for track in tracks:
            if int(track["created_at"][:4]) < 2000:
                continue
            text_date = track["created_at"][:10]
            if text_date in self.tracks_by_date:
                self.tracks_by_date[text_date].append(track)
            else:
                self.tracks_by_date[text_date] = [track]
            self.length_range.extend(track["likes_count"])
        for tracks in self.tracks_by_date.values():
            likes = sum([t["likes_count"] for t in tracks])
            self.length_range_by_date.extend(likes)

    def draw(self, drawer, output):
        """Set the Poster's drawer and draw the tracks."""
        self.tracks_drawer = drawer
        d = svgwrite.Drawing(output, (f"{self.width}mm", f"{self.height}mm"))
        d.viewbox(0, 0, self.width, self.height)
        d.add(d.rect((0, 0), (self.width, self.height), fill=self.colors["background"]))
        self.__draw_header(d)
        self.__draw_footer(d)
        self.__draw_tracks(d, XY(self.width - 20, self.height - 30 - 30), XY(10, 30))
        d.save()

    def __draw_tracks(self, d, size: XY, offset: XY):
        self.tracks_drawer.draw(d, size, offset)

    def __draw_header(self, d):
        text_color = self.colors["text"]
        title_style = "font-size:12px; font-family:Arial; font-weight:bold;"
        d.add(d.text(self.title, insert=(10, 20), fill=text_color, style=title_style))

    def __draw_footer(self, d):
        text_color = self.colors["text"]
        value_style = "font-size:9px; font-family:Arial"

        self.__compute_track_statistics()
        d.add(
            d.text(
                self.athlete,
                insert=(10, self.height-6),
                fill=text_color,
                style=value_style,
            )
        )
        d.add(
            d.text(
                "Audios" + f": {len(self.tracks)}",
                insert=(143, self.height-6),
                fill=text_color,
                style=value_style,
            )
        )

    def __compute_track_statistics(self):
        length_range = ValueRange()
        total_likes = 0
        total_length_year_dict = defaultdict(int)
        for t in self.tracks:
            date = datetime.datetime.strptime(t["created_at"].split(".")[0], "%Y-%m-%dT%H:%M:%S")
            year = date.year
            likes = t.get("likes_count", 0)
            total_likes += likes
            total_length_year_dict[year] += likes
            length_range.extend(likes)
        self.total_length_year_dict = total_length_year_dict

    def __compute_years(self, tracks):
        for t in tracks:
            try:
                if int(t["created_at"][:4]) > 2000:
                    self.years.add(t["created_at"][:4])
            except:
                pass
        self.years = sorted([int(i) for i in list(self.years)])
