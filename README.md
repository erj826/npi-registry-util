# npi-registry-util
Fetch profiles from the NPPES NPI registry

## Usage

In the `npi-registry-util/` directory include a file `doctor_names_npi.csv`. The csv must contain a list of names. Any number of middle names is ok, we drop everything besides the first and last name on the line.

i.e.
```
first,middle,last
alice,foo,bar
bob,foo,foo,baz
eve,baz
```

Run the script using

```
node index.mjs
```

The script will write a new csv (`doctor_profiles.csv`) to the directory.
