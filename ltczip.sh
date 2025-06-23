#!/bin/bash

declare -r reports_dir=reports
declare -r zip_dir=zipped-reports

for dir in "${reports_dir}"/[A-ZÉ]*
do
	dir=${dir%*/}
	echo "${dir}"
	zip "${zip_dir}/${dir}.zip" "${dir}"/*.pdf
done
