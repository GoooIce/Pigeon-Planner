#
# Gramps - a GTK+/GNOME based genealogy program
#
# Copyright (C) 2000-2007  Donald N. Allingham
# Copyright (C) 2007-2009  Brian G. Matherly
# Copyright (C) 2008       James Friedmann <jfriedmannj@gmail.com>
# Copyright (C) 2010       Jakim Friant
#
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#

# $Id: utils.py 18915 2012-02-17 16:51:40Z romjerome $

"""
A collection of utilities to aid in the generation of reports.
"""

#-------------------------------------------------------------------------
#
# Standard Python modules
#
#-------------------------------------------------------------------------

#------------------------------------------------------------------------
#
# GRAMPS modules
#
#------------------------------------------------------------------------
   
#-------------------------------------------------------------------------
#
#  Convert points to cm and back
#
#-------------------------------------------------------------------------
def pt2cm(pt):
    """
    Convert points to centimeters. Fonts are typically specified in points, 
    but the BaseDoc classes use centimeters.

    @param pt: points
    @type pt: float or int
    @returns: equivalent units in centimeters
    @rtype: float
    """
    return pt/28.3465

def cm2pt(cm):
    """
    Convert centimeters to points. Fonts are typically specified in points, 
    but the BaseDoc classes use centimeters.

    @param cm: centimeters
    @type cm: float or int
    @returns: equivalent units in points
    @rtype: float
    """
    return cm*28.3465

def rgb_color(color):
    """
    Convert color value from 0-255 integer range into 0-1 float range.

    @param color: list or tuple of integer values for red, green, and blue
    @type color: int
    @returns: (r, g, b) tuple of floating point color values
    @rtype: 3-tuple
    """
    r = float(color[0])/255.0
    g = float(color[1])/255.0
    b = float(color[2])/255.0
    return (r, g, b)

#-------------------------------------------------------------------------
#
#  From ImgManip.py
#
#-------------------------------------------------------------------------
def image_actual_size(x_cm, y_cm, x, y):
    """
    Calculate what the actual width & height of the image should be.

    :param x_cm: width in centimeters
    :type source: int
    :param y_cm: height in centimeters
    :type source: int
    :param x: desired width in pixels
    :type source: int
    :param y: desired height in pixels
    :type source: int
    :rtype: tuple(int, int)
    :returns: a tuple consisting of the width and height in centimeters
    """

    ratio = float(x_cm)*float(y)/(float(y_cm)*float(x))

    if ratio < 1:
        act_width = x_cm
        act_height = y_cm*ratio
    else:
        act_height = y_cm
        act_width = x_cm/ratio

    return (act_width, act_height)

def resize_to_buffer(source, size, crop=None):
    """
    Loads the image and resizes it. Instead of saving the file, the data
    is returned in a buffer.

    :param source: source image file, in any format that gtk recognizes
    :type source: unicode
    :param size: desired size of the destination image ([width, height])
    :type size: list
    :param crop: cropping coordinates
    :type crop: array of integers ([start_x, start_y, end_x, end_y])
    :rtype: buffer of data 
    :returns: raw data
    """
    import gtk
    img = gtk.gdk.pixbuf_new_from_file(source)

    if crop:
        # Gramps cropping coorinates are [0, 100], so we need to convert to pixels
        start_x = int((crop[0]/100.0)*img.get_width())
        start_y = int((crop[1]/100.0)*img.get_height())
        end_x = int((crop[2]/100.0)*img.get_width())
        end_y = int((crop[3]/100.0)*img.get_height())

        img = img.subpixbuf(start_x, start_y, end_x-start_x, end_y-start_y)

    # Need to keep the ratio intact, otherwise scaled images look stretched
    # if the dimensions aren't close in size
    (size[0], size[1]) = image_actual_size(size[0], size[1], img.get_width(), img.get_height())

    scaled = img.scale_simple(int(size[0]), int(size[1]), gtk.gdk.INTERP_BILINEAR)

    return scaled

