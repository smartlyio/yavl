import { model, validateModel } from '../src';

type GeoTargeting = {
  country: string;
  region: string;
};

type TargetingForm = {
  geo: GeoTargeting;
};

type ExternalData = {
  allowedCountries: string[];
  allowedRegions: string[];
};

const myModel = model<TargetingForm, ExternalData>(
  (form, { field, dependency, externalData, validate }) => [
    field(form, 'geo', (geo) => [
      field(geo, 'region', (region) => [
        validate(
          region,
          dependency(externalData, 'allowedRegions'),
          (region, allowedRegions) => allowedRegions.includes(region),
          'Invalid region'
        )
      ])
    ])
  ]
);

validateModel(
  myModel,
  // form data
  {
    geo: {
      country: 'FI',
      region: 'NEW_YORK'
    }
  },
  // external data (comes over API)
  {
    allowedCountries: ['FI', 'US'],
    allowedRegions: ['UUSIMAA']
  }
);

console.log(myModel);
