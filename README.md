# ont-ltc-reports
Retrieve Ontario Ministry of Health and Long-Term Care inspection reports from https://publicreporting.ltchomes.ne

## NOTE
This was written and run under Cygwin on Windows; it should work fine on other OS's but no testing has taken place for them.

## Prerequisites
1. Install [node.js](https://nodejs.org/en/download)
2. Download this project from github
3. From the project root directory, run `npm install` to pull in the node.js dependencies

## Running the script
After completing the prerequisites, run the script by typing
```bash
node ltc-inspection-reports.js --verbose | tee run.txt
```

The `--verbose option is` recommended to show progress; teeing to run.txt is occasionally useful if you want to review the run output for problems.
To run without showing progress information, type
```bash
node ltc-inspection-reports.js
```

If the script fails, re-run it. It will not download any files it has already retrieved. You may need to rerun it several times.
If you want to start restart where the script left off, you may use the `--startat` option combined with the `--verbose` option.
The `--verbose` option will give the internal name of the home (e.g. WOODLAND VILLA); use this, with double quotation marks and all in upper case, in the `--startat` option:

```bash
$ node ltc-inspection-reports.js --verbose
loading https://publicreporting.ltchomes.net/en-ca/Search_Selection.aspx
Reports will be saved to reports2
found 675 homes
<snip>
Retrieving reports for WOODINGFORD LODGE - WOODSTOCK (https://publicreporting.ltchomes.net/en-ca/homeprofile.aspx?Home=M632)
retrieving reports2/WOODINGFORD LODGE - WOODSTOCK/Inspection May 13, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=39346&FacilityID=21287)
retrieving reports2/WOODINGFORD LODGE - WOODSTOCK/Inspection (en Francais) May 13, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=39347&FacilityID=21287)
<snip>
Retrieving reports for WOODLAND VILLA (https://publicreporting.ltchomes.net/en-ca/homeprofile.aspx?Home=2743)
retrieving reports2/WOODLAND VILLA/Inspection Apr 28, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=38988&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Inspection (en Francais) Apr 28, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=38989&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Inspection Mar 10, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=37963&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Inspection (en Francais) Mar 10, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=37964&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Inspection Jan 16, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=36937&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Inspection (en Francais) Jan 16, 2025 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=36938&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Proactive Compliance Inspection Oct 02, 2024 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=37662&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Proactive Compliance Inspection (en Francais) Oct 02, 2024 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=37663&FacilityID=20585)
retrieving reports2/WOODLAND VILLA/Inspection Sep 09, 2024 - PDF.pdf (https://publicreporting.ltchomes.net/en-ca/File.aspx?RecID=34838&FacilityID=20585)
<Failure here>
node ltc-inspection-reports.js --verbose --startat "WOODLAND VILLA" | tee run.txt
```
