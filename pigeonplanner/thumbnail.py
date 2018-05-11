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


import os
import hashlib

import gtk
import gobject

from pigeonplanner.core import const


def get_image(src_file):
    try:
        filename = get_path(src_file)
        return gtk.gdk.pixbuf_new_from_file(filename)
    except (gobject.GError, OSError):
        return gtk.gdk.pixbuf_new_from_file_at_size(const.LOGO_IMG, 75, 75)

def get_path(src_file):
    filename = __build_path(src_file)
    if not os.path.isfile(filename):
        __create_image(src_file)
    elif os.path.getmtime(src_file) > os.path.getmtime(filename):
        __create_image(src_file)
    return os.path.abspath(filename)

def __build_path(path):
    md5_hash = hashlib.md5(path)
    return os.path.join(const.THUMBDIR, md5_hash.hexdigest()+".png")

def __create_image(src_file):
    filename = __build_path(src_file)
    try:
        pixbuf = gtk.gdk.pixbuf_new_from_file_at_size(src_file, 200, 200)
        pixbuf.save(filename, "png")
    except:
        pass

