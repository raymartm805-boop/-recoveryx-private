# Device Monitor

Responsive device inventory dashboard with owner-entered device and account records.

## Features
- Add and remove device inventory records
- Record account labels supplied by device owners
- Search inventory
- Browser-local persistence using local storage
- Session activity list

## Limitations
This is an inventory dashboard only. It does not remotely inspect devices, verify logged-in sessions, or receive live telemetry/location. Records are stored in the browser used to access the page and are not synchronized to a server.

## Deploy
Static site. Publish the `device-monitor` directory.