#!/bin/bash

declare -r reports_dir=reports

for dir in "${reports_dir}"/[A-ZÉ]*
do
	if [ -d "${dir}" ]
	then
		echo "\"${dir}"\", $(ls "${dir}" | wc -l)
	fi
done
