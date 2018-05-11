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
Parser to get all pigeons
"""


from pigeonplanner import database
from pigeonplanner.core import enums
from pigeonplanner.core import common


class PigeonParser(object):
    def __init__(self):
        self.pigeons = {}

    def build_pigeons(self):
        for pigeon in database.get_all_pigeons():
            self.add_pigeon(pigeon)

    def get_pigeons(self):
        return self.pigeons

    def get_pigeon(self, pindex=None, band=None):
        if pindex is None and band is not None:
            pindex = common.get_pindex_from_band(*band)
        try:
            pobj = self.pigeons[pindex]
        except KeyError:
            pobj = None
        return pobj

    def get_parents(self, pigeon):
        sire_pindex = common.get_pindex_from_band(*pigeon.get_sire())
        sire = self.get_pigeon(sire_pindex)
        if sire is None and sire_pindex != "":
            sire = self.add_empty_pigeon(sire_pindex, enums.Sex.cock, False)

        dam_pindex = common.get_pindex_from_band(*pigeon.get_dam())
        dam = self.get_pigeon(dam_pindex)
        if dam is None and dam_pindex != "":
            dam = self.add_empty_pigeon(dam_pindex, enums.Sex.hen, False)

        return sire, dam

    def add_pigeon(self, data=None, pindex=None):
        if data is None and pindex is not None:
            data = database.get_pigeon_data(pindex)
        pobj = Pigeon()
        pobj.set_data(**data)
        self.pigeons[pobj.pindex] = pobj
        return pobj

    def add_empty_pigeon(self, pindex, sex, visible=True, sire="", dam=""):
        if pindex == "":
            raise ValueError
        band, year = common.get_band_from_pindex(pindex)
        sband, syear = common.get_band_from_pindex(sire)
        dband, dyear = common.get_band_from_pindex(dam)
        data = {"pindex": pindex, "band": band, "year": year, "sex": sex,
                "show": int(visible), "sire": sband, "yearsire": syear,
                "dam": dband, "yeardam": dyear}
        rowid = database.add_pigeon(data)
        data.update({"Pigeonskey": rowid, "active": 1, "colour": "", "name": "",
                     "strain": "", "loft": "", "image": "", "extra1": "", "extra2": "",
                     "extra3": "", "extra4": "", "extra5": "", "extra6": ""})
        pobj = self.add_pigeon(data)
        return pobj

    def update_pigeon(self, pindex, old_pindex=None):
        if old_pindex is not None and old_pindex != pindex:
            self.pigeons[pindex] = self.pigeons.pop(old_pindex)
        pobj = self.pigeons[pindex]
        pobj.set_data(**database.get_pigeon_data(pindex))
        return pobj

    def remove_pigeon(self, pindex):
        del self.pigeons[pindex]


# Keep a global parser instance
parser = PigeonParser()


class Pigeon(object):
    def set_data(self, Pigeonskey, pindex, band, year, sex, show, active, colour,
                 name, strain, loft, image, sire, yearsire, dam, yeardam,
                 extra1, extra2, extra3, extra4, extra5, extra6):
        self.pindex = pindex
        self.ring = band
        self.year = year
        self.sex = sex
        self.show = show
        self.active = active
        self.colour = colour
        self.name = name
        self.strain = strain
        self.loft = loft
        self.image = image
        self.sire = sire
        self.yearsire = yearsire
        self.dam = dam
        self.yeardam = yeardam
        self.extra1 = extra1
        self.extra2 = extra2
        self.extra3 = extra3
        self.extra4 = extra4
        self.extra5 = extra5
        self.extra6 = extra6

    def __repr__(self):
        return "<Pigeon %s>" % self.pindex

    def get_pindex(self):
        return self.pindex

    def get_band(self):
        return self.ring, self.year

    def get_band_string(self, short=False):
        year = self.year if not short else self.year[2:]
        return "%s / %s" % (self.ring, year)

    def get_ring(self):
        return self.ring

    def get_sex(self):
        return self.sex

    def get_sex_string(self):
        return common.get_sex(self.sex)

    def is_cock(self):
        return self.sex == enums.Sex.cock

    def is_hen(self):
        return self.sex == enums.Sex.hen

    def get_visible(self):
        return self.show

    def get_active(self):
        return self.active

    def get_status(self):
        return common.get_status(self.active)

    def get_colour(self):
        return self.colour

    def get_name(self):
        return self.name

    def get_strain(self):
        return self.strain

    def get_loft(self):
        return self.loft

    def get_image(self):
        return self.image

    def get_sire(self):
        return self.sire, self.yearsire

    def get_sire_pindex(self):
        return common.get_pindex_from_band(self.sire, self.yearsire)

    def get_sire_string(self, short=False):
        year = self.yearsire if not short else self.yearsire[2:]
        return "%s / %s" % (self.sire, year)

    def get_dam(self):
        return self.dam, self.yeardam

    def get_dam_pindex(self):
        return common.get_pindex_from_band(self.dam, self.yeardam)

    def get_dam_string(self, short=False):
        year = self.yeardam if not short else self.yeardam[2:]
        return "%s / %s" % (self.dam, year)

    def get_extra(self):
        return (self.extra1, self.extra2, self.extra3,
                self.extra4, self.extra5, self.extra6)

