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
import sys
import shutil
import logging
logger = logging.getLogger(__name__)
import sqlite3
sqlite3.register_adapter(str, lambda s: s.decode("utf-8"))

from pigeonplanner.core import const
from .schemas import Tables, Schema


__all__ = ["DatabaseSession", "MigrationError", "InvalidValueError", "Tables", "Schema"]



class MigrationError(Exception): pass
class InvalidValueError(Exception): pass


class DatabaseSession(object):
    def __init__(self):
        self.dbfile = None
        self.connection = None
        self.cursor = None

    def open(self, dbfile=None):
        self.dbfile = dbfile or const.DATABASE
        self.is_new_db = not os.path.exists(self.dbfile)
        self.connection, self.cursor = self.__db_connect()

        if self.is_new_db:
            Schema.create_new(self)

    def close(self):
        self.connection.close()

    def __db_connect(self):
        try:
            conn = sqlite3.connect(self.dbfile,
                            detect_types=sqlite3.PARSE_DECLTYPES|sqlite3.PARSE_COLNAMES)
        except Exception as e:
            logger.critical("Could not connect to database")
            logger.critical(e)
            logger.debug("Databasedir: %s" % const.PREFDIR)
            logger.debug("Database: %s" % self.dbfile)
            logger.debug("Databasedir exists: %s"  % os.path.exists(const.PREFDIR))
            logger.debug("Database exists: %s" % os.path.exists(self.dbfile))
            logger.debug("Databasedir writable: %s" % os.access(const.PREFDIR, os.W_OK))
            logger.debug("Database writable: %s" % os.access(self.dbfile, os.W_OK))
            logger.debug("Encoding: %s" % sys.getfilesystemencoding())
            sys.exit()

        conn.row_factory = sqlite3.Row
        return (conn, conn.cursor())

    ##############
    ##  Helper methods
    ##############
    def get_table_names(self):
        self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [row[0] for row in self.cursor.fetchall() if row[0]]

    def get_column_names(self, table):
        self.cursor.execute("PRAGMA table_info(%s)" % table)
        return [row[1] for row in self.cursor.fetchall() if row[1]]

    def add_column(self, table, column):
        self.cursor.execute("ALTER TABLE %s ADD COLUMN %s" % (table, column))
        self.connection.commit()

    def remove_table(self, table):
        self.cursor.execute("DROP TABLE IF EXISTS %s" % table)
        self.connection.commit()

    def add_table(self, table, columns):
        self.cursor.execute("CREATE TABLE IF NOT EXISTS %s (%s)" % (table, columns))
        self.connection.commit()

    def recreate_table(self, table, columns):
        self.cursor.execute("CREATE TEMP TABLE tmp_%s AS SELECT * FROM %s" % (table, table))
        self.cursor.execute("DROP TABLE %s" % table)
        self.cursor.execute("CREATE TABLE IF NOT EXISTS %s (%s)" % (table, columns))
        self.cursor.execute("INSERT INTO %s SELECT * FROM tmp_%s" % (table, table))
        self.cursor.execute("DROP TABLE tmp_%s" % table)
        self.connection.commit()

    ##############
    ##  Maintenance
    ##############
    def get_database_version(self):
        self.cursor.execute("PRAGMA user_version")
        return self.cursor.fetchone()[0]

    def set_database_version(self, version):
        self.cursor.execute("PRAGMA user_version=%s" % version)
        self.connection.commit()

    def optimize_database(self):
        self.cursor.execute("VACUUM")

    def check_database_integrity(self):
        """
        PRAGMA integrity_check;
        PRAGMA integrity_check(integer)

        This pragma does an integrity check of the entire database. It looks for
        out-of-order records, missing pages, malformed records, and corrupt indices.
        If any problems are found, then strings are returned (as multiple rows with
        a single column per row) which describe the problems. At most integer errors
        will be reported before the analysis quits. The default value for integer
        is 100. If no errors are found, a single row with the value "ok" is returned.
        """

        self.cursor.execute("PRAGMA integrity_check")
        return self.cursor.fetchall()

    def check_schema(self):
        changed = False
        db_version = self.get_database_version()
        backupdb = self.dbfile + "_bckp"
        if db_version < Schema.VERSION:
            # Make a backup of the database before migrating
            shutil.copy(self.dbfile, backupdb)

        while db_version < Schema.VERSION:
            module = "pigeonplanner.database.schemas.schema_%s" % (db_version + 1)
            mod = __import__(module, fromlist=["Schema"])
            try:
                mod.Schema.migrate(self)
            except:
                # Catch any exception during migration!
                logger.error("Database migration failed!", exc_info=True)
                shutil.copy(backupdb, self.dbfile)
                os.remove(backupdb)
                raise MigrationError

            db_version += 1
            changed = True
        self.set_database_version(db_version)

        try:
            os.remove(backupdb)
        except:
            pass

        return changed

