2.2.4:
 * Fixed not being able to add images on Mac OSX
 * Fixed calendar popup on Mac OSX
 * Updated packages on Mac OSX
 * Updated Windows installer
 * Updated translations

2.2.3:
 * Fixed error on invalid speed value when importing results
 * Fixed error when changing the results view mode on an empty database
 * Fixed error in velocity calculator when selecting a distance with an invalid unit
 * Fixed error when trying to restore an invalid zip file as backup
 * Show a error dialog if the path is not writeable when exporting pigeons

2.2.2:
 * Fixed frequent error when deleting multiple pigeons
 * Fixed error when trying to add an existing racepoint
 * Fixed DTD resultparser for slightly different time identifiers
 * Fixed error when cancelling print to file through the Windows fileprinter dialog
 * Fixed error when entering a new result with a wrong date format
 * Show message when reporting a failed result import throws an error
 * Fixed possible hang during quit when database optimization fails
 * Fixed rare error when using the distance chooser in the velocity calculator
 * Added Persian translation
 * Updated translations

2.2.1:
 * Fixed exporting pigeons to csv
 * Fixed DTD resultparser for results with an extra column at the end
 * Make database backup before update and restore in case of error

2.2.0:
 * Added option to choose between old and new results view
 * Added speed, windspeed and temperature to the results
 * Added a new widow status
 * Added option to add result directly into pigeon details
 * Added image to the status combobox
 * Added more fields to the resultparser
 * Added pigeon search icon to the results filter band entry
 * Added csv export to the results window
 * Fixed the mainwindow statistics to match the current visible pigeons
 * Fixed some errors in the date widget
 * Fixed error on invalid date or bandnumber in results filter
 * Fixed error when adding or updating pigeon when filter is active
 * Fixed adding and updating results in splitted view
 * Fixed error when printing pedigree from the menu
 * Fixed translations on Mac OS X
 * Improved location of the pigeon status
 * Only show visible pigeons in pigeon search dialog
 * Date is no longer required in the pigeon status
 * Don't allow invalid values to be added through the resultparser
 * Many code cleanups
 * Updated translations

2.0.2:
 * Fixed error when editing bandnumbers
 * Fixed adding pigeons to medication record
 * Added pigeon status filter
 * Ellipsize pigeon label in remove dialog

2.0.1:
 * Fixed error in backup and restore dialogs
 * Fixed error when trying to make a pigeon visible again
 * Fixed error when editing a breeding record
 * Fixed error when opening a media file
 * Show errordialog when saving a report to a non-writeable location
 * Only enable info buttons in breeding tab if child bandnumber is given
 * Select pigeon in pigeon list dialog with double click
 * Log error when errorreporting fails
 * Changed default pedigree save name
 * Remove the custom cursor on the image widget
 * Little code updates
 * Updated translations

2.0.0:
 * Removed the calendar
 * Removed the database tool
 * Removed theme option on Windows
 * Removed the pigeon search dialog
 * Rewrite of the database backend
 * Improved default database schema
 * Split up results into races and results
 * Allow an empty value as place in the results
 * Added new filter dialog for the pigeons
 * Added new filter dialog for the results
 * Added new pedigree layout
 * Added option to search for racepoint distance in the velocity calculator
 * Added icon to the sex combobox
 * Added menu option to show all pigeons in the list
 * Show icon in sex column in the main treeview
 * Localize all float numbers
 * Report missing third-party modules on request instead of startup
 * Fixed wrong date in calendar popup
 * Fixed automated backup string in the options dialog
 * Fixed distance calculation for some formats
 * Fixed broken application icon in Windows Vista and newer
 * Fixed treeview scrolling when using the navigation arrows
 * Various interface changes
 * Lots of code cleanup/reorganisation

1.10.3:
 * Added icon to sex entry in detailsview
 * Fixed error clicking image widget when no pigeon is selected
 * Fixed error when parsing result
 * Removed character limit in extra fields
 * Increased width of detailsview
 * Little code fixes
 * Added Vietnamese translation

1.10.2:
 * Fixed error when entering personal data from pedigree
 * Fixed error in datamanager
 * Show message when no unused objects are found in the datamanager

1.10.1:
 * Fixed version comparison in updater
 * Fixed unhandled error when connection fails in location chooser
 * Include parser version on parsing error
 * Disable Geopy logmessages lower than ERROR

1.10.0:
 * Always add and edit pigeons in a seperate dialog
 * Added a location latitude/longitude chooser
 * Added options to set default distance and speed units
 * Keep filter active after closing it
 * General fields in resultparser are editable
 * Group breeding records by mate
 * Fixed reporterror on missing image
 * Fixed rare error in filechoosers
 * Fixed missing translation strings
 * Fixed and improved the Data-Deerlijk result parser
 * Lowered required GTK version
 * Hold widgets in seperate class
 * Changed application imports
 * Greatly improved buildscripts
 * General improvements to code and GUI
 * Moved to a plugin system for resultparsers
 * Updated translations

1.8.0:
 * Complete report rewrite
 * Complete rewrite of configuration backend
 * Added option to hide deleted pigeons in lists
 * Added option to color row of deleted pigeons in lists
 * Added option to check for development updates
 * Added option to set custom coefficient multiplier
 * Added edit option to relatives
 * Added message when no pigeon is found in relatives
 * Added default icon for all windows
 * Change cursor when hovering over image
 * Fixed unhandled exception when loft coordinates are not set
 * Fixed missing pedigreeboxes on recent GTK+
 * Fixed photoalbum window position
 * Fixed error on pedigree shortcut when no pigeon is selected
 * Fixed automatic selection of pigeon
 * Fixed add range label in menu
 * Fixed default language value
 * Expand all settings categories by default
 * Don't show database upgrade message on new database
 * Split column options into seperate category
 * Updated setup files
 * Updated translations

1.6.2:
 * Fixed focus issues in detailsview
 * Fixed time input in velocity calculator
 * Fixed exporting multiple selected pigeons
 * Fixed error when changing from on loan status
 * Updated translations

1.6.0:
 * Added pedigree navigation arrows
 * Added support for sector and category in result parser
 * Added new exception dialog
 * Fixed problems with adding young birds in breeding section
 * Fixed error when adding a range
 * Fixed error when calculating distance without loft coordinates
 * Fixed unhandled date exception
 * Fixed unhandled medication exception
 * Fixed unhandled status exception
 * Fixed handling bandnumbers with a slash
 * Fixed unhandled exception with removed pigeon details
 * Added and updated various languages

1.4.2:
 * Added more statistics
 * Added help buttons
 * Rewrite of pedigree window which fixes strange crashes
 * Fixed problem with entering pigeon details
 * Fixed problem when calculating distances
 * Fixed error when status date is wrong
 * Fixed showing wrong pigeon in breeding view
 * Fixed error when a mate is removed
 * Fixed error when adding an existing item to dataset
 * Show message when editing band number to existing pigeon
 * Fixed rare breeding dialog issue
 * Updated translations

1.4.0:
 * Added a breeding tab
 * Added a breeder and on loan status
 * Added a distance calculator
 * Added latitude/longitude entries to the addressbook
 * Added an export function
 * Improved pigeon search dialog
 * Categorize files in media tab
 * Added option to show a status column
 * Checking for an update before reporting an error
 * Remember last directory in filechoosers
 * Added new shortcuts
 * Added message when the database has been upgraded
 * Added menu entry to select all pigeons
 * Fixed thumbnail errors
 * Fixed racepoint manager error
 * Fixed printing filtered results
 * Don't allow adding media when no pigeon is selected
 * Show error when the database is too new
 * Mark required fields
 * Updated Python version in Windows installer
 * Updated and added translations
 * Lots of code changes, improvements and cleanup

1.2.0:
 * Added a media tab
 * Added a racepoint manager
 * Added a resultsheet parser
 * Added option to remove unused objects
 * Added option to show/hide result columns
 * Added parameter to enable console logging
 * Added image popup for pedigree boxes
 * Fixed bug when removing a pigeon with non-active status
 * Fixed mixed up weather and wind column names
 * Improved filechoosers
 * Improved thumbnails
 * Pedigree boxes now highlight on mouseover
 * Various little GUI improvements
 * Various unicode improvements
 * Various code fixes and improvements

1.0.4:
 * Fixed bug where first pigeon won't show up
 * Fixed error when using navigation arrows on empty list
 * Fixed and improved adding an existing pigeon
 * Fixed error when removing the database
 * Fixed wrong language detection when updated from a previous version
 * Fixed some thumbnail problems
 * Fixed error when saving the pedigree on some systems
 * Improved and fixed logmessages
 * Improved exception logging
 * Show dialog when the program is already running (Windows only)
 * Don't show error in the logs when no translation is found
 * Updated translations
 * Added Polish translation

1.0.2:
 * Fixed untranslated treeview columns
 * Fixed error in photo album
 * Fixed missing translation when custom language is set
 * Improved operating system detection in information dialog
 * Updated INSTALL file
 * Updated translations

1.0.0:
 No detailed changes

0.8.2:
 * Added option to save the pedigree to pdf
 * Added new filter dialog
 * Fixed error connecting to database on non utf-8
 * Fixed bug where log doesn't show on non utf-8
 * Improved search dialog
 * Create thumbnails again if something goes wrong
 * Various improvements and changes

0.8.0:
 * Added feature to set the pigeon status
 * Added option to show statistics
 * Added options to configure printing
 * Added ability to resize the bottom notebook
 * Fixed display of wrong info in pedigree
 * Use thumbnails as pictures instead of full sized original
 * Changed the way pedigreeboxes behave
 * Moved the detailed pedigree button to the toolbar
 * Improved the display on small screen resolutions
 * Updated GTK+ and PyGTK binaries on Windows
 * Various little GUI and code fixes

0.7.4:
 * Added Bosnian language
 * Fixed hangups or crashes when autochecking for updates
 * Fixed printing wrong details on pedigree
 * Fixed possible error when deleting a pigeon
 * Fixed pedigree when Cairo is not available
 * Various code changes

0.7.2:
 * Added Russian language
 * Fixed error when editing a pigeon
 * Fixed error when printing the pedigree (#508902)
 * Fixed possible imagepath problems

0.7.0:
 * Added option to add colour and name to pedigree pigeons
 * Fixed bug where theme couldn't be changed on Vista and up
 * Fixed bug where image would disappear when editing pigeon
 * Fixed bug where error pops up when trying to print the pedigree
 * Fixed bug where the database couldn't be deleted
 * Greatly improved the results
 * Removed the option that will allow only one instance
 * Various little GUI changes
 * Various little code changes and cleanup

0.6.0:
 * Added a photo album
 * Added option to only allow one instance of the program
 * Added option that a donation dialog would show after 10 runs
 * Fixed bug where automatic backup was broken
 * Fixed bug where making backups through toolswindow was broken
 * Code changed from signal dict to instance

0.5.4:
 * Added Arabic language
 * Added option to optimize the database
 * Added option to remove the database
 * Fixed bug where results would disappear when changing the pigeons number
 * Fixed bug where program crashes when making a starter on Linux
 * Fixed bug where user can't remove item
 * Fixed bug where program would fail if nul-file isn't found
 * Fixed bug where previous pedigree would stay when no pigeon is selected
 * Fixed bug where previous image would stay when no pigeon is selected
 * E-mailaddress in the logfile viewer is clickable
 * Changed calendar cancel behavior
 * Changed default automatic backup interval to 30
 * Changed default theme to clearlooks-classic
 * Cleaned up the application folder on Windows
 * Cleaned up the icons
 * Restirct date-entry to 10 characters
 * Made a new logo
 * Various code and interface fixes

0.5.2:
 * Added options to customize columns
 * Added option to make automatic backups
 * Added option to clear a pedigree field
 * Added option to change the language
 * Added apply and cancel buttons to the calendar
 * Fixed that comboboxentry's activate default
 * Fixed bug when editing to an existing pigeon in pedigree
 * Fixed bug where theme was set wrong on first run
 * Improved pedigree window
 * Improved printed pedigree
 * Show full traceback in the log
 * Don't backup logfiles
 * Little random improvements

0.5.0:
 * Added option to edit the pedigree
 * Added option to edit an address
 * Added option to search for a pigeon
 * Added a logviewer
 * Added tooltips to some editable widgets
 * Fixed bug that editing a band number is impossible
 * Fixed bug that ring entry wouldn't always focus on add/edit

0.4.8:
 * Added pigeon details to printed pedigree
 * Added sex of selected pigeon to detailed pedigree
 * Added images to pedigree tabs
 * Fixed bug where pedigree couldn't display some special characters
 * Fixed possible hangup when checking for updates
 * Fixed jumping of the detail pedigree
 * Fixed detailed pedigree window height for 1024x768
 * Fixed missing image in preferences tabs (Windows)
 * Fixed download URLs
 * Don't show older or same pigeon whe searching for parents

0.4.6:
 * Fixed problem when adding pictures on Windows
 * Fixed error when trying to add items to datasets
 * Fixed downloadpage url
 * Fixed error when clicking picture when no pigeon is selected
 * Fixed screensize to fit on a 1024x768 resolution
 * Added icons to preferences tabs
 * Only show "keep results" when pigeon has results
 * Made an installer for Windows

0.4.4:
 * Fixed crash at startup when database is empty
 * Fixed problem when removing a pigeon
 * Fixed 'go to pigeon'
 * Added a confirmation dialog when removing results
 * Code cleaup

0.4.2:
 * Fixed bug where wrong item would be saved in dataset when adding a pigeon
 * Fixed bug where result can't be deleted
 * Fixed bug where result can't be editted
 * Don't let distance spinbutton go below zero
 * Changed filenames
 * Some code cleanup

0.4:
 * Added a menubar
 * Added option to show/hide toolbar
 * Added option to show/hide statusbar
 * Added option to change the theme (only on Windows)
 * Added option to check for updates at startup
 * Added option to add items to the datasets
 * Added more supported image filetypes
 * Added statistics to the tools
 * Added an address tool
 * Added statusbar messages
 * Fixed crash when adding a pigeon after go-to is clicked
 * Fixed bug where removing a pigeon didn't always work
 * Fixed bug where clicking the aboutdialog doesn't work
 * Fixed bug where results would stay when no pigeon is selected
 * Fixed bug when making a backup
 * Fixed bug when right clicking on empty treeview
 * Fixed bug where the database wouldn't accept special characters
 * Increased bandnumber length
 * Made sure minutes have a leading zero
 * Removed personal info from preferences dialog
 * Lots of user interface cleanups
 * Lots of code fixes and cleanups

0.3:
 * Added option to remove items from datasets
 * Added option to go to pigeon in relatives tab
 * Added option to remove/edit result by right-clicking
 * Added option to view bigger image
 * Added option to print velocity
 * Added option to check for updates
 * Fixed extra column that has wrong position (#386958)
 * Various code/GUI cleanup

0.2:
 * Added a velocity calculator
 * Added a tools window
 * Added option to keep results when removing pigeon
 * Added option to edit results
 * Changed to SQLite as database
 * Fixed bug when removing pigeon
 * Fixed bug that backups aren't cross-platform
 * Other minor code changes and cleanup

0.1.2:
 * Added option to show/hide navigation arrows
 * Added program version in window titlebar
 * Fixed crash of some dialogs
 * Changed and improved app folder detection on windows
 * Rewrote the aboutdialog
 * Renamed Globals to Const
 * Moved messagedialog to seperate file
 * Moved program details to __init__.py
 * Lots of minor code changes

0.1:
 * Initial Release
