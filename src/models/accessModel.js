const bcrypt = require('bcrypt');
const { Schema, model } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { throwError } = require("../utils/handleErrors");

const accessModel = new Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true
    },
    assigning_ranks_to_adminstrators: {
        type: Boolean,
        required: true,
        default: true
      },
    switching_auto_accepting_for_new_service_providers: {
        type: Boolean,
        required: true,
        default: true,
    },
    suspending_service_providers_or_clients: {
        type: Boolean,
        required: true,
        default: true,
      },
    approving_new_service_providers_joining_the_system: {
        type: Boolean,
        required: true,
        default: true
    },
    viewing_client_statistics_and_service_provider_performance: {
        type: Boolean,
        default: false,
      },
    approving_client_payout_to_service_providers: {
        type: Boolean,
        default: false,
    },
    setting_allowable_currencies_in_the_system: {
        type: Boolean,
        default: false,
    },
    setting_referral_commission_percentage: {
        type: Boolean,
        default: false,
    },
    viewing_client_statistics_and_service_provider_performance: {
        type: Boolean,
        default: false,
    },
    creating_new_services_both_online_and_in_person_services: {
        type: Boolean,
        default: false,
    },
    approving_featured_services: {
        type: Boolean,
        default: false,
    },
    approving_ads_in_the_system: {
        type: Boolean,
        default: false,
    },
    settling_service_disputes_between_clients_and_service_providers: {
        type: Boolean,
        default: false,
    },

    changing_ads_and_featured_service_fees: {
      type: Boolean,
      default: false,
  },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ref) {
        delete ref.password;
        delete ref.tokens;
      },
    },
    toObject: {
      transform(doc, ref) {
        delete ref.password;
        delete ref.tokens;
      },
    },
  },
  {
    strictQuery: 'throw'
  }
);

  
  const AccessModel = model('Access', accessModel);
  module.exports = AccessModel;
