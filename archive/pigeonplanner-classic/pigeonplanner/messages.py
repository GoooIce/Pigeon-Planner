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


ERROR = _("Error")
WARNING = _("Warning")


MSG_ALREADY_RUNNING = (_("Pigeon Planner is already running."),
                       None,
                       ERROR)

MSG_NEW_DATABASE = (_("The database you are trying to open is too new "
                      "for your version of Pigeon Planner. You need to "
                      "reinstall the latest version to continue."),
                    None,
                    ERROR)
MSG_UPDATED_DATABASE = (_("The Pigeon Planner databases has been updated "
                          "to match the current version. Note that it is "
                          "not advised to run an older version, which can "
                          "lead to data corruption."),
                        None,
                        "Database updated")
MSG_ERROR_DATABASE = (_("The database migration has failed! Any further actions are "
                        "stopped to prevent data loss. Please contact the developers "
                        "to fix this problem."),
                      None,
                      ERROR)

MSG_EVENT_NOTIFY = (_("Notification for '%s'"),
                    _("Go to the calendar?"),
                    "")

MSG_INVALID_IMAGE = (_("Invalid image!"),
                     _("This image is either not supported or corrupt, "
                       "please choose another one."),
                     ERROR)
MSG_IMAGE_MISSING = (_("Loading image failed!"),
                     _("Maybe you have renamed the image or moved it on your disk."),
                     ERROR)

MSG_SHOW_PIGEON = (_("This pigeon already exists, but isn't showing. "
                     "Do you want to show it again?"),
                   None,
                   WARNING)
MSG_OVERWRITE_PIGEON = (_("This pigeon already exists. Overwrite it?"),
                        None,
                        WARNING)
MSG_PIGEON_EXISTS = (_("This pigeon already exists."),
                     None,
                     ERROR)
MSG_ADD_PIGEON = (_("This pigeon doesn't exist. Do you want to add it?"),
                  None,
                  _("Adding pigeon"))
MSG_NO_PIGEON = (_("The selected pigeon can't be found."),
                 None,
                 _("Not found!"))
MSG_NO_PARENT = (_("Can't search for parents, enter the pigeon band first."),
                 None,
                 ERROR)

MSG_EMPTY_FIELDS = (_("Invalid input!"),
                    _("The ringnumber and year are necessary."),
                    ERROR)
MSG_INVALID_NUMBER = (_("Invalid input!"),
                      _("Only numbers are accepted as year input."),
                      ERROR)
MSG_INVALID_LENGTH = (_("Invalid input!"),
                      _("Check the length of the year."),
                      ERROR)
MSG_INVALID_RANGE = (_("Invalid input!"),
                     _("Only numbers are allowed when adding multiple pigeons."),
                     ERROR)

MSG_EMPTY_DATA = (_("Invalid input!"),
                  _("At least the date and racepoint have to be entered."),
                  ERROR)
MSG_INVALID_FORMAT = (_("Invalid input!"),
                      _("The date you entered has the wrong format. "
                        "It should be ISO-format (YYYY-MM-DD)."),
                      ERROR)
MSG_RESULT_EXISTS = (_("Invalid input!"),
                     _("The result you want to add already exists."),
                     ERROR)
MSG_REMOVE_RESULT = (_("Removing the selected result"),
                     _("Are you sure?"),
                     "")
MSG_REMOVE_MEDIA = (_("Removing the selected media file"),
                    _("Are you sure?"),
                    "")

MSG_NAME_EMPTY = (_("Invalid input!"),
                  _("The name has to be entered."),
                  ERROR)
MSG_NAME_EXISTS = (_("Invalid input!"),
                   _("The persoon you want to add already exists."),
                   ERROR)
MSG_REMOVE_ADDRESS = (_("Removing '%s'"),
                      _("Are you sure you want to remove this person from "
                        "your addresses?"),
                      "")

MSG_REMOVE_ITEM = (_("Removing '%s' from '%s'."),
                   _("Are you sure you want to remove this item?"),
                   "")

MSG_REMOVE_DATABASE = (_("Removing database"),
                       _("Are you sure you want to remove the database? "
                         "All data will be lost."),
                       _("Removing database"))

MSG_BACKUP_SUCCES = (_("The backup was successfully created."),
                     None,
                     _("Completed!"))
MSG_BACKUP_FAILED = (_("There was an error making the backup."),
                     None,
                     _("Failed!"))
MSG_RESTORE_SUCCES = (_("The backup was successfully restored."),
                      _("The program will now quit automaticly."),
                      _("Completed!"))
MSG_RESTORE_FAILED = (_("There was an error restoring the backup."),
                      None,
                      _("Failed!"))

MSG_NO_INFO = (_("No personal information found."),
               _("This will be shown on top of the printed pedigree.\n"
                 "Do you want to add it now?"),
               "")

MSG_PRINT_ERROR = (_("Error printing the pedigree"),
                   None,
                   ERROR)
MSG_PRINTOP_ERROR = (_("An error occured in the print operation!"),
                     _("See the logfile (File->Logfile viewer) for more info."),
                     ERROR)

MSG_DEFAULT_OPTIONS = (_("This will set back all the settings to the default values."),
                       _("Are you sure?"),
                       _("Default settings"))

MSG_RESTART_APP = (_("Pigeon Planner needs to be restarted for the changes "
                     "to take effect."),
                   None,
                   _("Restart required"))

MSG_UPDATE_NOW = (_("Update available!"),
                  _("There is an update available, do you want to download it now?"),
                  "")

MSG_NEED_EMAIL = (_("The recipient and sender's e-mailaddress are required."),
                  None,
                  ERROR)

MSG_CONNECTION_ERROR = _("Error trying to get information. Are you connected to the internet?")
MSG_UPDATE_AVAILABLE = _("A new version is available.")
MSG_NO_UPDATE = _("You already have the latest version installed.")
MSG_UPDATE_DEVELOPMENT = _("This isn't normal, or you must be running a development version")

