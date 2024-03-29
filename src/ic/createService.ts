import { IDL } from '@dfinity/candid';
import { checkAuth } from '@/ic/CheckAuth';
import { buildService } from '@/ic/Service';
import { createIcxActor } from '@/ic/createIcxActor';
import { createPlugActor } from '@/ic/createPlugActor';
import { createInfinityActor } from '@/ic/createInfinityActor';
import store from '@/store';
import Vue from 'vue';

export const createService = async <T>(
  canisterId: string,
  IDL: IDL.InterfaceFactory,
  renew = true,
  isUpdate = true
): Promise<T> => {
  const principal = localStorage.getItem('principal');
  const priList = JSON.parse(localStorage.getItem('priList')) || {};
  if (principal && isUpdate) {
    await checkAuth(renew, canisterId);
  }
  let service: T;
  if (!isUpdate) {
    service = buildService(null, IDL, canisterId);
  } else if ((window as any).icx) {
    service = await createIcxActor(IDL, canisterId);
  } else if (priList[principal] === 'Plug') {
    const plugIc = (window as any).ic?.plug;
    console.log(principal);
    console.log(plugIc.principalId);
    if (principal !== plugIc.principalId) {
      Vue.prototype.$info({
        content: `Please check if you are logged into Plug with account ${principal}.`,
        class: 'connect-plug',
        icon: 'connect-plug',
        centered: true,
        okText: 'Confirm',
        onOk() {}
      });
      return null;
    } else {
      service = await createPlugActor(IDL, canisterId);
    }
  } else if (priList[principal] === 'Infinity') {
    service = await createInfinityActor(IDL, canisterId);
  } else {
    service = buildService(
      store.getters['common/getIdentity'],
      IDL,
      canisterId
    );
  }
  return service;
};
