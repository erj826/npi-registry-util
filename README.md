# npi-registry-util

Fetches records from the [NPPES NPI registry](https://npiregistry.cms.hhs.gov/)

## Usage

Pass the script a csv file containing a list of names. Any number of middle names is ok, we drop everything besides the first and last name on the line.

i.e.

```
first,middle,last
alice,foo,bar
bob,foo,foo,baz
eve,baz
```

Run the script using

```
node index.mjs doctor_names_npi.csv
```

The script will write a new csv (`npi_records.csv`) to the directory.
