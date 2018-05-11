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

from .baseschema import BaseSchema


class Tables:
    PIGEONS = "Pigeons"
    RESULTS = "Results"
    BREEDING = "Breeding"
    MEDIA = "Media"
    MED = "Medication"
    ADDR = "Addresses"
    COLOURS = "Colours"
    RACEPOINTS = "Racepoints"
    TYPES = "Types"
    CATEGORIES = "Categories"
    SECTORS = "Sectors"
    LOFTS = "Lofts"
    STRAINS = "Strains"
    WEATHER = "Weather"
    WIND = "Wind"
    SOLD = "Sold"
    LOST = "Lost"
    DEAD = "Dead"
    BREEDER = "Breeder"
    LOANED = "Onloan"
    WIDOW = "Widow"


class Schema(BaseSchema):
    VERSION = 2
    SCHEMA = {
        # The upgrade_dummy table is very important and shouldn't be removed!
        # The 1.x serie of Pigeon Planner had a schema checking function which
        # updated the database to the latest schema and raised a KeyError by
        # one of the helper methods which indicated that the database contained
        # a table that didn't exist in the schema. The main startup script would
        # catch this error and show a nice dialog that told the user the database
        # was too new. The 2.x series changed all of this behaviour, but we'd still
        # like to show this dialog instead of an unexpected exception dialog when
        # the user tries to open this database in the 1.x series.
        "upgrade_dummy": [("dummy", "TEXT", "")],
        Tables.PIGEONS: [("Pigeonskey", "INTEGER", "PRIMARY KEY"),
                         ("pindex", "TEXT", "UNIQUE NOT NULL"),
                         ("band", "TEXT", "NOT NULL"),
                         ("year", "TEXT", "NOT NULL"),
                         ("sex", "INTEGER", "NOT NULL"),
                         ("show", "INTEGER", "DEFAULT 1"),
                         ("active", "INTEGER", "DEFAULT 1"),
                         ("colour", "TEXT", "DEFAULT ''"),
                         ("name", "TEXT", "DEFAULT ''"),
                         ("strain", "TEXT", "DEFAULT ''"),
                         ("loft", "TEXT", "DEFAULT ''"),
                         ("image", "TEXT", "DEFAULT ''"),
                         ("sire", "TEXT", "DEFAULT ''"),
                         ("yearsire", "TEXT", "DEFAULT ''"),
                         ("dam", "TEXT", "DEFAULT ''"),
                         ("yeardam", "TEXT", "DEFAULT ''"),
                         ("extra1", "TEXT", "DEFAULT ''"),
                         ("extra2", "TEXT", "DEFAULT ''"),
                         ("extra3", "TEXT", "DEFAULT ''"),
                         ("extra4", "TEXT", "DEFAULT ''"),
                         ("extra5", "TEXT", "DEFAULT ''"),
                         ("extra6", "TEXT", "DEFAULT ''")],
        Tables.RESULTS: [("Resultkey", "INTEGER", "PRIMARY KEY"),
                         ("pindex", "TEXT", "NOT NULL"),
                         ("date", "TEXT", "NOT NULL"),
                         ("point", "TEXT", "NOT NULL"),
                         ("place", "INTEGER", "NOT NULL"),
                         ("out", "INTEGER", "NOT NULL"),
                         ("speed", "REAL", "DEFAULT 0.0"),
                         ("sector", "TEXT", "DEFAULT ''"),
                         ("type", "TEXT", "DEFAULT ''"),
                         ("category", "TEXT", "DEFAULT ''"),
                         ("wind", "TEXT", "DEFAULT ''"),
                         ("windspeed", "TEXT", "DEFAULT ''"),
                         ("weather", "TEXT", "DEFAULT ''"),
                         ("temperature", "TEXT", "DEFAULT ''"),
                         ("ownplace", "INTEGER", "DEFAULT 0"),
                         ("ownout", "INTEGER", "DEFAULT 0"),
                         ("comment", "TEXT", "DEFAULT ''")],
        Tables.BREEDING: [("Breedingkey", "INTEGER", "PRIMARY KEY"),
                          ("sire", "TEXT", "NOT NULL"),
                          ("dam", "TEXT", "NOT NULL"),
                          ("date", "TEXT", "NOT NULL"),
                          ("laid1", "TEXT", "DEFAULT ''"),
                          ("hatched1", "TEXT", "DEFAULT ''"),
                          ("pindex1", "TEXT", "DEFAULT ''"),
                          ("success1", "INTEGER", "DEFAULT 0"),
                          ("laid2", "TEXT", "DEFAULT ''"),
                          ("hatched2", "TEXT", "DEFAULT ''"),
                          ("pindex2", "TEXT", "DEFAULT ''"),
                          ("success2", "INTEGER", "DEFAULT 0"),
                          ("clutch", "TEXT", "DEFAULT ''"),
                          ("box", "TEXT", "DEFAULT ''"),
                          ("comment", "TEXT", "DEFAULT ''")],
        Tables.MEDIA: [("Mediakey", "INTEGER", "PRIMARY KEY"),
                       ("pindex", "TEXT", "NOT NULL"),
                       ("type", "TEXT", "NOT NULL"),
                       ("path", "TEXT", "NOT NULL"),
                       ("title", "TEXT", "DEFAULT ''"),
                       ("description", "TEXT", "DEFAULT ''")],
        Tables.MED: [("Medicationkey", "INTEGER", "PRIMARY KEY"),
                     ("medid", "TEXT", "NOT NULL"),
                     ("pindex", "TEXT", "NOT NULL"),
                     ("date", "TEXT", "NOT NULL"),
                     ("description", "TEXT", "DEFAULT ''"),
                     ("doneby", "TEXT", "DEFAULT ''"),
                     ("medication", "TEXT", "DEFAULT ''"),
                     ("dosage", "TEXT", "DEFAULT ''"),
                     ("comment", "TEXT", "DEFAULT ''"),
                     ("vaccination", "INTEGER", "DEFAULT 0")],

        Tables.SOLD: [("Soldkey", "INTEGER", "PRIMARY KEY"),
                      ("pindex", "TEXT", "NOT NULL"),
                      ("person", "TEXT", "DEFAULT ''"),
                      ("date", "TEXT", "DEFAULT ''"),
                      ("info", "TEXT", "DEFAULT ''")],
        Tables.LOST: [("Lostkey", "INTEGER", "PRIMARY KEY"),
                      ("pindex", "TEXT", "NOT NULL"),
                      ("racepoint", "TEXT", "DEFAULT ''"),
                      ("date", "TEXT", "DEFAULT ''"),
                      ("info", "TEXT", "DEFAULT ''")],
        Tables.DEAD: [("Deadkey", "INTEGER", "PRIMARY KEY"),
                      ("pindex", "TEXT", "NOT NULL"),
                      ("date", "TEXT", "DEFAULT ''"),
                      ("info", "TEXT", "DEFAULT ''")],
        Tables.BREEDER: [("Breederkey", "INTEGER", "PRIMARY KEY"),
                         ("pindex", "TEXT", "NOT NULL"),
                         ("start", "TEXT", "DEFAULT ''"),
                         ("end", "TEXT", "DEFAULT ''"),
                         ("info", "TEXT", "DEFAULT ''")],
        Tables.LOANED: [("Onloankey", "INTEGER", "PRIMARY KEY"),
                        ("pindex", "TEXT", "NOT NULL"),
                        ("loaned", "TEXT", "DEFAULT ''"),
                        ("back", "TEXT", "DEFAULT ''"),
                        ("person", "TEXT", "DEFAULT ''"),
                        ("info", "TEXT", "DEFAULT ''")],
        Tables.WIDOW: [("Widowkey", "INTEGER", "PRIMARY KEY"),
                       ("pindex", "TEXT", "NOT NULL"),
                       ("partner", "TEXT", "DEFAULT ''"),
                       ("info", "TEXT", "DEFAULT ''")],

        Tables.ADDR: [("Addresskey", "INTEGER", "PRIMARY KEY"),
                      ("name", "TEXT", "NOT NULL"),
                      ("street", "TEXT", "DEFAULT ''"),
                      ("code", "TEXT", "DEFAULT ''"),
                      ("city", "TEXT", "DEFAULT ''"),
                      ("country", "TEXT", "DEFAULT ''"),
                      ("phone", "TEXT", "DEFAULT ''"),
                      ("email", "TEXT", "DEFAULT ''"),
                      ("comment", "TEXT", "DEFAULT ''"),
                      ("me", "INTEGER", "DEFAULT 0"),
                      ("latitude", "TEXT", "DEFAULT ''"),
                      ("longitude", "TEXT", "DEFAULT ''")],
        Tables.COLOURS: [("Colourkey", "INTEGER", "PRIMARY KEY"),
                         ("colour", "TEXT", "UNIQUE NOT NULL")],
        Tables.LOFTS: [("Loftkey", "INTEGER", "PRIMARY KEY"),
                       ("loft", "TEXT", "UNIQUE NOT NULL")],
        Tables.STRAINS: [("Strainkey", "INTEGER", "PRIMARY KEY"),
                         ("strain", "TEXT", "UNIQUE NOT NULL")],
        Tables.RACEPOINTS: [("Racepointkey", "INTEGER", "PRIMARY KEY"),
                            ("racepoint", "TEXT", "UNIQUE NOT NULL"),
                            ("xco", "TEXT", "DEFAULT ''"),
                            ("yco", "TEXT", "DEFAULT ''"),
                            ("distance", "TEXT", "DEFAULT ''"),
                            ("unit", "INTEGER", "DEFAULT 0")],
        Tables.TYPES: [("Typekey", "INTEGER", "PRIMARY KEY"),
                       ("type", "TEXT", "UNIQUE NOT NULL")],
        Tables.CATEGORIES: [("Categorykey", "INTEGER", "PRIMARY KEY"),
                            ("category", "TEXT", "UNIQUE NOT NULL")],
        Tables.SECTORS: [("Sectorkey", "INTEGER", "PRIMARY KEY"),
                         ("sector", "TEXT", "UNIQUE NOT NULL")],
        Tables.WEATHER: [("Weatherkey", "INTEGER", "PRIMARY KEY"),
                         ("weather", "TEXT", "UNIQUE NOT NULL")],
        Tables.WIND: [("Windkey", "INTEGER", "PRIMARY KEY"),
                      ("wind", "TEXT", "UNIQUE NOT NULL")],
    }
    INDEXES = [
        ("pindex_pigeons", Tables.PIGEONS, ["pindex"]),
        ("date_racepoint", Tables.RESULTS, ["date", "point"]),
    ]

    @classmethod
    def _create_indexes(cls, session):
        for name, table, columns in cls.INDEXES:
            session.cursor.execute("CREATE INDEX IF NOT EXISTS %s ON %s (%s)" % (name, table, ", ".join(columns)))

    @classmethod
    def create_new(cls, session):
        for table_name in cls.get_table_names():
            column_sql = cls.get_columns_sql(table_name)
            session.cursor.execute("CREATE TABLE IF NOT EXISTS %s (%s)" % (table_name, column_sql))
        cls._create_indexes(session)
        session.set_database_version(cls.VERSION)

    @classmethod
    def migrate(cls, session):
        logger.debug("Migrating from 1 to 2")

        # Results table schema changes
        logger.debug("Updating results table schema")
        table = Tables.RESULTS
        ## 1. Rename the current table
        session.cursor.execute("ALTER TABLE %s RENAME TO %s_old" % (table, table))
        ## 2. Recreate table with new schema
        column_sql = cls.get_columns_sql(table)
        session.cursor.execute("CREATE TABLE %s (%s)" % (table, column_sql))
        ## 3. Copy data to new table
        cols = "pindex, date, point, place, out, sector, type, category, wind, weather, ownplace, ownout, comment"
        session.cursor.execute("INSERT INTO %s (%s) SELECT %s FROM %s_old" % 
                                    (table, cols, cols, table))
        ## 4. Drop old table
        session.cursor.execute("DROP TABLE %s_old" % table)

        # Added widow status
        logger.debug("Adding widow status table")
        table_name = Tables.WIDOW
        column_sql = cls.get_columns_sql(table_name)
        session.cursor.execute("CREATE TABLE IF NOT EXISTS %s (%s)" % (table_name, column_sql))

        # Commit all migration changes
        session.connection.commit()

