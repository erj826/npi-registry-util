import fetch from "node-fetch";
import converter from "json-2-csv";
import { writeFile, createReadStream } from "fs";
import csvParser from "csv-parser";

const BASE_ROUTE = "https://npiregistry.cms.hhs.gov/api/";
const TAXONOMY_DESCRIPTION = "surgery";
const ADDRESS_PURPOSE_TYPES = {
  mailing: "MAILING",
  location: "LOCATION",
};
const ALLOWED_TAXONOMIES = [
  "208200000X",
  "2082S0099X",
  "2082S0105X",
  "2086S0122X",
];

const OUTPUT_FILE = "npi_records.csv";

const fetchDocs = async ({ firstName, lastName, taxonomy }) => {
  const response = await fetch(
    // `${BASE_ROUTE}?version=2.1&taxonomy_description=${taxonomy}&first_name=${firstName}&last_name=${lastName}`
    `${BASE_ROUTE}?version=2.1&first_name=${firstName}&last_name=${lastName}`
  );
  const data = await response.json();
  const profiles = data.results
    ? data.results.map((result) => parseProfile(result)).filter((prof) => prof)
    : [];
  return profiles;
};

const parseProfile = (profile) => {
  const basic = profile.basic;
  const mailingAddress = profile.addresses.filter(
    (address) => address.address_purpose === ADDRESS_PURPOSE_TYPES.mailing
  )[0];
  const practiceAddress = profile.addresses.filter(
    (address) => address.address_purpose === ADDRESS_PURPOSE_TYPES.location
  )[0];

  const primaryTaxonomy = profile.taxonomies.filter(
    (taxonomy) => taxonomy.primary
  )[0];

  return ALLOWED_TAXONOMIES.includes(primaryTaxonomy.code)
    ? {
        first_name: basic?.first_name,
        last_name: basic?.last_name,
        gender: basic?.gender,
        npi: profile?.number,
        sole_proprietor: basic?.sole_proprietor,
        status: basic?.status,
        mailing_address_street: `${mailingAddress?.address_1} ${mailingAddress?.address_2}`,
        mailing_address_city: mailingAddress?.city,
        mailing_address_state: mailingAddress?.state,
        mailing_address_zipcode: mailingAddress?.postal_code,
        primary_practice_street: `${practiceAddress?.address_1} ${practiceAddress?.address_2}`,
        primary_practice_city: practiceAddress?.city,
        primary_practice_state: practiceAddress?.state,
        primary_practice_zipcode: practiceAddress?.postal_code,
        state: primaryTaxonomy?.state,
        license_number: primaryTaxonomy?.license,
        primary_taxonomy_code: primaryTaxonomy?.code,
        primary_taxonomy_desc: primaryTaxonomy?.desc,
      }
    : {};
};

const main = async () => {
  const input = process.argv[2];

  // Read a csv as input
  let doctorList = [];
  await createReadStream(input)
    .pipe(csvParser())
    .on("data", (row) => {
      const nameArray = Object.values(row);
      const cleanedNameArray = nameArray.filter((name) => name);
      const name = {
        firstName: cleanedNameArray[0],
        lastName: cleanedNameArray.at(-1),
      };
      if (name.firstName && name.lastName) {
        doctorList.push(name);
      }
    })
    .on("end", async () => {
      console.log("Successfully processed CSV");
      console.log(`Found ${doctorList.length} names`);

      // Fetch profiles
      let doctors = [];
      let i = 0;

      for (const { firstName, lastName } of doctorList) {
        console.log(
          `Fetching record ${++i} of ${doctorList.length} (${
            (i / doctorList.length) * 100
          }%)`
        );
        const profiles = await fetchDocs({
          firstName,
          lastName,
          taxonomy: TAXONOMY_DESCRIPTION,
        });
        if (profiles) {
          doctors.push(...profiles);
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      // Write output csv
      const writeCsv = (err, csv) => {
        if (err) throw err;
        writeFile(OUTPUT_FILE, csv, "utf8", function (err) {
          if (err) {
            console.log("Error occured.");
          } else {
            console.log("Success.");
          }
        });
      };

      converter.json2csv(doctors, writeCsv, {
        prependHeader: true,
      });
    });
};

main();
