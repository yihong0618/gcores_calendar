"""Create and maintain info about a given activity track (corresponding to one GPX file)."""
# Copyright 2016-2019 Florian Pigorsch & Contributors. All rights reserved.
#
# Use of this source code is governed by a MIT-style
# license that can be found in the LICENSE file.

import datetime
import gpxpy as mod_gpxpy
import json
import os
import s2sphere as s2
from exceptions import TrackLoadError


class Track:
    """Create and maintain info about a given activity track (corresponding to one GPX file).

    Attributes:
        file_names: Basename of a given file passed in load_gpx.
        polylines: Lines interpolated between each coordinate.
        start_time: Activity start time.
        end_time: Activity end time.
        length: Length of the track (2-dimensional).
        self.special: True if track is special, else False.

    Methods:
        load_gpx: Load a GPX file into the current track.
        bbox: Compute the border box of the track.
        append: Append other track to current track.
        load_cache: Load track from cached json data.
        store_cache: Cache the current track.
    """

    def __init__(self):
        self.file_names = []
        self.polylines = []
        self.start_time = None
        self.end_time = None
        self.length = 0
        self.special = False

    def load_gpx(self, file_name: str):
        """Load the GPX file into self.

        Args:
            file_name: GPX file to be loaded .

        Raises:
            TrackLoadError: An error occurred while parsing the GPX file (empty or bad format).
            PermissionError: An error occurred while opening the GPX file.
        """
        try:
            self.file_names = [os.path.basename(file_name)]
            # Handle empty gpx files
            # (for example, treadmill runs pulled via garmin-connect-export)
            if os.path.getsize(file_name) == 0:
                raise TrackLoadError("Empty GPX file")
            with open(file_name, "r") as file:
                self._load_gpx_data(mod_gpxpy.parse(file))
        except TrackLoadError as e:
            raise e
        except mod_gpxpy.gpx.GPXXMLSyntaxException as e:
            raise TrackLoadError("Failed to parse GPX.") from e
        except PermissionError as e:
            raise TrackLoadError("Cannot load GPX (bad permissions)") from e
        except Exception as e:
            raise TrackLoadError("Something went wrong when loading GPX.") from e

    def bbox(self) -> s2.LatLngRect:
        """Compute the smallest rectangle that contains the entire track (border box)."""
        bbox = s2.LatLngRect()
        for line in self.polylines:
            for latlng in line:
                bbox = bbox.union(s2.LatLngRect.from_point(latlng.normalized()))
        return bbox

