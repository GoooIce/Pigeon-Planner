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

"""
Functions for some common tasks
"""


import os
import cgi
import csv
import codecs
import random
import locale
import inspect
import urllib2
import datetime
import cStringIO
import webbrowser

from pigeonplanner import database
from pigeonplanner.core import const
from pigeonplanner.core import enums
from pigeonplanner.core import config


def get_sexdic():
    return {enums.Sex.cock: _("Cock"),
            enums.Sex.hen: _("Hen"),
            enums.Sex.unknown: _("Young bird")}

def get_sex(sex):
    return get_sexdic()[sex]

SEX_IMGS = {enums.Sex.cock: os.path.join(const.IMAGEDIR, "symbol_male.png"),
            enums.Sex.hen: os.path.join(const.IMAGEDIR, "symbol_female.png"),
            enums.Sex.unknown: os.path.join(const.IMAGEDIR, "symbol_young.png")}

def get_statusdic():
    return {enums.Status.dead: _("Dead"),
            enums.Status.active: _("Active"),
            enums.Status.sold: _("Sold"),
            enums.Status.lost: _("Lost"),
            enums.Status.breeder: _("Breeder"),
            enums.Status.loaned: _("On loan"),
            enums.Status.widow: _("Widow")}

def get_status(status):
    return get_statusdic()[status]

statustables = {enums.Status.dead: database.Tables.DEAD,
                enums.Status.active: "Active",
                enums.Status.sold: database.Tables.SOLD,
                enums.Status.lost: database.Tables.LOST,
                enums.Status.breeder: database.Tables.BREEDER,
                enums.Status.loaned: database.Tables.LOANED,
                enums.Status.widow: database.Tables.WIDOW}
def get_status_table(status):
    return statustables[status]

STATUS_IMGS = {enums.Status.dead: os.path.join(const.IMAGEDIR, "status_dead.png"),
               enums.Status.active: os.path.join(const.IMAGEDIR, "status_active.png"),
               enums.Status.sold: os.path.join(const.IMAGEDIR, "status_sold.png"),
               enums.Status.lost: os.path.join(const.IMAGEDIR, "status_lost.png"),
               enums.Status.breeder: os.path.join(const.IMAGEDIR, "status_breeder.png"),
               enums.Status.loaned: os.path.join(const.IMAGEDIR, "status_onloan.png"),
               enums.Status.widow: os.path.join(const.IMAGEDIR, "status_widow.png")}

def get_function_name():
    """
    Retrieve the name of the function/method
    """

    return inspect.stack()[1][3]

def get_date():
    return datetime.date.today().strftime(const.DATE_FORMAT)


def count_active_pigeons():
    """
    Count the active pigeons as total and seperate sexes
    """

    cocks = 0
    hens = 0
    ybirds = 0
    total = 0
    for pigeon in database.get_all_pigeons():
        if not pigeon["show"]: continue

        total += 1

        if pigeon["sex"] == enums.Sex.cock:
            cocks += 1
        elif pigeon["sex"] == enums.Sex.hen:
            hens += 1
        elif pigeon["sex"] == enums.Sex.unknown:
            ybirds += 1

    return total, cocks, hens, ybirds

def get_own_address():
    """
    Retrieve the users personal info
    """

    userinfo = dict(name="", street="", code="", city="", country="",
                    phone="", email="", comment="")
    info = database.get_address_data({"me": 1})
    if info:
        userinfo["name"] = info["name"]
        userinfo["street"] = info["street"]
        userinfo["code"] = info["code"]
        userinfo["city"] = info["city"]
        userinfo["country"] = info["country"]
        userinfo["phone"] = info["phone"]
        userinfo["email"] = info["email"]
        userinfo["comment"] = info["comment"]
    return userinfo

def get_pindex_from_band(band, year):
    """
    Create the pindex from the pigeons band and year

    @param band: The pigeons band number
    @param year: The year of the pigeon
    """

    return band+year

def get_pindex_from_band_string(bandstring):
    """
    Create the pindex from a pigeons bandstring

    @param bandstring: The pigeons bandstring
    """

    band, year = bandstring.rsplit("/", 1)
    return get_pindex_from_band(band.strip(), year.strip())

def get_band_from_pindex(pindex):
    """
    Retrieve the pigeons band and year from a pindex

    @param pindex: The pindex of the pigeon
    """

    band = pindex[:-4]
    year = pindex[-4:]
    return band, year

def calculate_coefficient(place, out, as_string=False):
    """
    Calculate the coefficient of a result

    @param place: The pigeons place
    @param out: The total number of pigeons
    @param as_string: Return a localized string
    """

    coef = (float(place)/float(out))*config.get("options.coef-multiplier")
    if as_string:
        return locale.format_string("%.4f", coef)
    return coef

def format_place_coef(place, out):
    coef = calculate_coefficient(place, out)
    if place == 0:
        coefstr = "-"
        placestr = "-"
    else:
        coefstr = calculate_coefficient(place, out, as_string=True)
        placestr = str(place)
    return placestr, coef, coefstr

def format_speed(value):
    if value <= 0.0:
        return ""
    return locale.format_string("%.2f", value)

def add_zero_to_time(value):
    """
    Add a zero in front of a one digit number

    @param value: The value to be checked
    """

    if value >= 0 and value < 10:
        return "0%s" % value
    return str(value)

def get_random_number(value):
    """
    Get a random number of the given length

    @param value: The length of the number
    """

    return "".join([random.choice("0123456789") for x in range(value)])

def url_hook(about, link):
    webbrowser.open(link)

def email_hook(about, email):
    webbrowser.open("mailto:%s" % email)

def escape_text(text):
    if not text:
        return ""
    return cgi.escape(text, True)

def open_file(path):
    from pigeonplanner.ui.messagedialog import ErrorDialog

    norm_path = unicode(os.path.normpath(path), "utf-8")
    if not os.path.exists(norm_path):
        ErrorDialog((_("Error: This file does not exist"), None, _("Error")))
        return

    if const.WINDOWS:
        try:
            os.startfile(norm_path)
        except WindowsError as exc:
            ErrorDialog((_("Error opening file:"), str(exc), _("Error")))
    else:
        if const.OSX:
            utility = "open"
        else:
            utility = "xdg-open"
        search = os.environ["PATH"].split(":")
        for lpath in search:
            prog = os.path.join(lpath, utility)
            if os.path.isfile(prog):
                import subprocess
                subprocess.call((prog, norm_path))
                return

def open_help(article):
    webbrowser.open(const.DOCURL % article)

def get_pagesize_from_opts():
    optvalue = config.get("printing.general-paper")
    if optvalue == 0:
        psize = "A4"
    elif optvalue == 1:
        psize = "Letter"
    return psize


class URLOpen:
    """
    A custom class to open URLs
    """
    def __init__(self, cookie=None):
        """
        Build our urllib2 opener

        @param cookie: Cookie to be used
        """

        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cookie))

    def open(self, url, body, headers=None, timeout=8):
        """
        Open a given url

        @param url: The url to open
        @param body: Extra data to send along
        @param headers: Optional header
        @param timeout: timeout in seconds
        """

        if not headers:
            headers = const.USER_AGENT
        else:
            if not "User-Agent" in headers:
                headers.update(const.USER_AGENT)

        return self.opener.open(urllib2.Request(url, body, headers), timeout=timeout)


# Unicode classes taken from http://docs.python.org/library/csv.html
class UTF8Recoder:
    """
    Iterator that reads an encoded stream and reencodes the input to UTF-8
    """
    def __init__(self, f, encoding):
        self.reader = codecs.getreader(encoding)(f)

    def __iter__(self):
        return self

    def next(self):
        return self.reader.next().encode("utf-8")


class UnicodeReader:
    """
    A CSV reader which will iterate over lines in the CSV file "f",
    which is encoded in the given encoding.
    """

    def __init__(self, f, dialect=csv.excel, encoding="utf-8", **kwds):
        f = UTF8Recoder(f, encoding)
        self.reader = csv.reader(f, dialect=dialect, **kwds)

    def next(self):
        row = self.reader.next()
        return [unicode(s, "utf-8") for s in row]

    def __iter__(self):
        return self


class UnicodeWriter:
    """
    A CSV writer which will write rows to CSV file "f",
    which is encoded in the given encoding.
    """

    def __init__(self, f, dialect=csv.excel, encoding="utf-8", **kwds):
        # Redirect output to a queue
        self.queue = cStringIO.StringIO()
        self.writer = csv.DictWriter(self.queue, dialect=dialect,
                                     quoting=csv.QUOTE_ALL, **kwds)
        self.stream = f
        self.encoder = codecs.getincrementalencoder(encoding)()

    def writerow(self, row):
        self.writer.writerow({k:str(v).encode("utf-8") for k,v in row.items()})
        # Fetch UTF-8 output from the queue ...
        data = self.queue.getvalue()
        data = data.decode("utf-8")
        # ... and reencode it into the target encoding
        data = self.encoder.encode(data)
        # write to the target stream
        self.stream.write(data)
        # empty queue
        self.queue.truncate(0)

    def writerows(self, rows):
        for row in rows:
            self.writerow(row)
