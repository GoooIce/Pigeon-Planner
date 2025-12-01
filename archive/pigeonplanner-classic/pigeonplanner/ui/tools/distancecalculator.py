# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.

# Pigeon Planner is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Pigeon Planner is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>


import logging
logger = logging.getLogger(__name__)

try:
    geopy_log = logging.getLogger("geopy")
    geopy_log.setLevel(logging.ERROR)
    from geopy import point
    from geopy import distance as gdistance
    geopy_available = True
except ImportError:
    geopy_available = False

from pigeonplanner import database
from pigeonplanner.ui import builder
from pigeonplanner.ui.widgets import comboboxes
from pigeonplanner.ui.messagedialog import ErrorDialog
from pigeonplanner.core import common
from pigeonplanner.core import errors


class DistanceCalculator(builder.GtkBuilder):
    def __init__(self, parent, racepoint=None):
        builder.GtkBuilder.__init__(self, "DistanceCalculator.ui")

        self._distance = 0.0
        self._unit = 0
        self._fill_location_combos(racepoint)
        self.widgets.window.set_transient_for(parent)
        self.widgets.window.show()

        if not geopy_available:
            self.widgets.window.set_sensitive(False)
            ErrorDialog((_("This tool needs Geopy 0.95.0 or higher to run correctly."), None, ""),
                        self.widgets.window)

    def close_window(self, widget, event=None):
        self._unit = self.widgets.combounit.get_active()
        self._distance = self.widgets.entryresult.get_text() or 0.0
        self.widgets.window.destroy()
        return False

    def on_buttonhelp_clicked(self, widget):
        common.open_help(12)

    def on_buttoncalculate_clicked(self, widget):
        try:
            latfrom = self.widgets.entrylatfrom.get_text(as_float=True)
            lngfrom = self.widgets.entrylongfrom.get_text(as_float=True)
            latto = self.widgets.entrylatto.get_text(as_float=True)
            lngto = self.widgets.entrylongto.get_text(as_float=True)
        except errors.InvalidInputError:
            ErrorDialog((_("The latitude and longitude need to be in "
                           "DD.dddddd° format to use this function."),
                         None, _("Error")), self.widgets.window)
            return

        if latfrom > 90 or latfrom < -90:
            latfrom, lngfrom = self.wgs84_to_latlon(latfrom, lngfrom)

        if latto > 90 or latto < -90:
            latto, lngto = self.wgs84_to_latlon(latto, lngto)

        dist = gdistance.distance((latfrom, lngfrom), (latto, lngto))
        unit = self.widgets.combounit.get_active()
        if unit == 1:
            distance = dist.kilometers
        elif unit == 2:
            distance = dist.meters
        elif unit == 5:
            distance = dist.feet
        elif unit == 6:
            distance = dist.miles
        elif unit == 7:
            distance = dist.nautical
        else:
            distance = dist.meters / self.widgets.combounit.get_unit()
        self.widgets.entryresult.set_text(str(round(distance, 2)))

    def on_combolocationfrom_changed(self, widget):
        if widget.get_active() == 0:
            # Custom selected
            editable = True
            latitude = ""
            longitude = ""
        elif widget.get_active() == 1:
            # Loft selected
            editable = False
            try:
                data = database.get_address_data({"me": 1})
                latitude = data["latitude"]
                longitude = data["longitude"]
            except TypeError:
                latitude, longitude = "", ""
        else:
            editable = False
            rp = widget.get_active_text()
            data = database.get_racepoint_data(rp)
            latitude = data["xco"]
            longitude = data["yco"]
        self.widgets.entrylatfrom.set_editable(editable)
        self.widgets.entrylongfrom.set_editable(editable)
        self.widgets.entrylatfrom.set_text(latitude)
        self.widgets.entrylongfrom.set_text(longitude)

    def on_combolocationto_changed(self, widget):
        if widget.get_active() == 0:
            # Custom selected
            editable = True
            latitude = ""
            longitude = ""
        elif widget.get_active() == 1:
            # Loft selected
            editable = False
            try:
                data = database.get_address_data({"me": 1})
                latitude = data["latitude"]
                longitude = data["longitude"]
            except TypeError:
                latitude, longitude = "", ""
        else:
            editable = False
            rp = widget.get_active_text()
            data = database.get_racepoint_data(rp)
            latitude = data["xco"]
            longitude = data["yco"]
        self.widgets.entrylatto.set_editable(editable)
        self.widgets.entrylongto.set_editable(editable)
        self.widgets.entrylatto.set_text(latitude)
        self.widgets.entrylongto.set_text(longitude)

    def get_unit(self):
        return self._unit

    def get_distance(self):
        return self._distance

    def wgs84_to_latlon(self, lat, lon):
        def split(number):
            nstr = str(number)
            gap2 = 2
            if "." in nstr:
                gap2 = 3 + len(nstr.split(".")[1])
            gap1 = gap2 + 2
            return nstr[:-gap1] or "0", nstr[-gap1:-gap2], nstr[-gap2:] 

        lat1, lat2, lat3 = split(lat)
        lon1, lon2, lon3 = split(lon)
        lat = "%s %s' %s\" %s" % (lat1, lat2, lat3, "N" if lat > 0 else "S")
        lon = "%s %s' %s\" %s" % (lon1, lon2, lon3, "E" if lon > 0 else "W")
        lat, lon, alt = point.Point("%s; %s" % (lat, lon))
        return lat, lon

    def _fill_location_combos(self, racepoint):
        data = database.get_all_data(database.Tables.RACEPOINTS)
        data.insert(0, _("Custom"))
        data.insert(1, _("Loft"))
        activefrom = 1 if racepoint is not None else 0
        activeto = racepoint+2 if racepoint is not None else 0
        comboboxes.fill_combobox(self.widgets.combolocationfrom, data, activefrom, False)
        comboboxes.fill_combobox(self.widgets.combolocationto, data, activeto, False)

