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


import gtk
import gobject

from pigeonplanner.core import errors


class LatLongEntry(gtk.Viewport):
    __gtype_name__ = "LatLongEntry"
    can_empty = gobject.property(type=bool, default=False, nick="Can empty")
    def __init__(self, editable=False, can_empty=False):
        gtk.Viewport.__init__(self)

        self._entry = gtk.Entry()

        self.can_empty = can_empty
        self.editable = editable
        self.add(self._entry)
        self.show_all()

        self._tooltip = _("Input should be in one of these formats:\n  "
                          "DD.dddddd°\n  "
                          "DD°MM.mmm’\n  "
                          "DD°MM’SS.s”")

    def get_editable(self):
        return self._editable

    def set_editable(self, editable):
        self._editable = editable
        self.set_shadow_type(gtk.SHADOW_NONE if editable else gtk.SHADOW_IN)
        self._entry.set_has_frame(editable)
        self._entry.set_editable(editable)
        self._entry.set_activates_default(editable)
    editable = gobject.property(get_editable, set_editable, bool, False, "Editable")

    def set_text(self, text):
        self._entry.set_text(str(text))

    def get_text(self, validate=True, as_float=False):
        value = self._entry.get_text()
        if validate:
            self.__validate(value, as_float)
        if as_float:
            value = value.replace(u",", u".")
            return float(value)
        return value

    def _warn(self):
        self._entry.set_icon_from_stock(gtk.ENTRY_ICON_PRIMARY, gtk.STOCK_STOP)
        self._entry.set_icon_tooltip_text(gtk.ENTRY_ICON_PRIMARY, self._tooltip)

    def _unwarn(self):
        self._entry.set_icon_from_stock(gtk.ENTRY_ICON_PRIMARY, None)

    def __validate(self, value, as_float=False):
        if self.can_empty and value == "":
            self._unwarn()
            return
        # Accepted values are:
        #    DD.dddddd°
        #    DD°MM.mmm’
        #    DD°MM’SS.s”
        value = value.replace(u",", u".")
        for char in u" -+":
            value = value.replace(char, u"")
        if self.__check_float_repr(value) is not None:
            self._unwarn()
            return
        if as_float:
            # We need the float repr, above float check failed
            raise errors.InvalidInputError(value)
        if self.__check_dms_repr(value) is not None: 
            self._unwarn()
            return
        self._warn()
        raise errors.InvalidInputError(value)

    def __check_float_repr(self, value):
        value = value.replace(u"°", u"")
        try : 
            return float(value)      
        except ValueError:
            return None

    def __check_dms_repr(self, value):
        # Replace the degree and quotes by colons...
        for char in u"°'\"":
            value = value.replace(char, u":")
        value = value.rstrip(u":")
        # ... so we can easily split the value up
        splitted = value.split(u":")

        # First value always should be all digits
        if not splitted[0].isdigit():
            return
        # Depending on format...
        if len(splitted) == 2:
            # ... minutes should be a valid float
            try:
                float(splitted[1])
            except ValueError:
                return
        elif len(splitted) == 3:
            # ... minutes should be all digits ...
            if not splitted[1].isdigit():
                return
            # ... and seconds a valid float
            try:
                float(splitted[2])
            except ValueError:
                return
        else:
            # Too many or little splitted values
            return
        return value

