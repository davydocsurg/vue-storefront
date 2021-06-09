import { UseStoreGetters, AgnosticAddress, AgnosticLocale } from '@vue-storefront/core';
import { Store, Channel, Address } from '../types/GraphQL';
import { StoresData, StoresItem } from '../types';
import { FilterCriteriaRecord, Localized, filterArrayByCriteriaRecord } from '../helpers/internals';

/**
 * Types
 */

interface StoreFilterCriteria {
  store?: FilterCriteriaRecord<Store>;
  channel?: FilterCriteriaRecord<Channel>
}

type StoreChannelSetKeys =
  'distributionChannels' |
  'supplyChannels';

/**
 * Helpers
 */

function mapToAddress(address: Address): AgnosticAddress {
  return {
    addressLine1: `${address?.country ?? ''} ${address?.city ?? ''} ${address?.postalCode ?? ''}`.trim(),
    addressLine2: `${address?.streetName ?? ''} ${address?.streetNumber ?? ''}`.trim(),
    _address: address ?? null
  };
}

function mapToLocale <T extends Localized>(localized: T): AgnosticLocale {
  return {
    code: localized.locale,
    label: ''
  };
}

function mapToLocales(localized: Localized[]): AgnosticLocale[] {
  return localized?.map(mapToLocale) ?? [];
}

function mapChannelToStoresItem (store: Store) {
  return function (channel: Channel): StoresItem {
    return {
      name: `${store?.name ?? ''} - ${channel?.name ?? ''}`.trim(),
      id: `${store?.id ?? ''}/${channel?.id ?? ''}`.trim(),
      description: channel?.description ?? '',
      geoLocation: channel?.geoLocation ?? null,
      locales: mapToLocales(channel?.descriptionAllLocales),
      address: mapToAddress(channel?.address),
      _storeID: store?.id ?? '',
      _channelID: channel?.id ?? ''
    };
  };
}

function mapChannelSet (store: Store, channels: Channel[]): StoresItem[] {
  return channels?.map(mapChannelToStoresItem(store)) ?? [];
}

function mapChannelSetByKey (store: Store, key: StoreChannelSetKeys, criteria?: FilterCriteriaRecord<Channel>): StoresItem[] {
  return mapChannelSet(
    store, filterArrayByCriteriaRecord<Channel>(
      store?.[key], criteria
    )
  );
}

function gainStoreItems (criteria?: FilterCriteriaRecord<Channel>) {
  return function (acc: StoresItem[], store: Store): StoresItem[] {
    return [
      ...acc,
      ...mapChannelSetByKey(store, 'distributionChannels', criteria),
      ...mapChannelSetByKey(store, 'supplyChannels', criteria)
    ];
  };
}

/**
 * Getters
 */

function getItems (stores: StoresData, criteria: StoreFilterCriteria = {}): StoresItem[] {
  return filterArrayByCriteriaRecord<Store>(stores?.results, criteria.store)?.reduce(gainStoreItems(criteria.channel), []) ?? [];
}

function getSelected (stores: StoresData): StoresItem {
  const [storeID, channelID] = (stores?._selected ?? '').split('/');
  return getItems(stores, { store: { id: storeID }, channel: { id: channelID } })[0];
}

/**
 * Export
 */

const storeGetters: UseStoreGetters<StoresData, StoresItem> = {
  getItems,
  getSelected
};

export default storeGetters;
