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


import mimetypes

import gtk


class MimeIconError(Exception): pass


def get_type(filename):
    """
    Get the mime type of the given file
    """

    if filename is None: return ""
    value = mimetypes.guess_type(filename)
    if value and value[0]:
        return value[0]
    return ""

def get_basetype(mime):
    """
    Get the basetype from a mimetype of format basetype/subtype
    """

    if mime is None:
        return ""
    return mime.split("/")[0]

_icontheme = gtk.icon_theme_get_default()
def get_pixbuf(mime):
    try:
        icon = "gnome-mime-%s" % mime.replace("/", "-")
        try:
            return _icontheme.load_icon(icon, 48, 0)
        except:
            try:
                icon = "gnome-mime-%s" % get_basetype(mime)
                return _icontheme.load_icon(icon, 48, 0)
            except:
                raise MimeIconError
    except:
        raise MimeIconError

def get_stock(mime):
    if is_directory(mime):
        return gtk.STOCK_DIRECTORY
    return gtk.STOCK_FILE

def is_image(mime):
    return get_basetype(mime) == "image"

def is_directory(mime):
    return get_basetype(mime) == "x-directory"

