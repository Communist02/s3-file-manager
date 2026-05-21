import { User } from "oidc-client-ts"
import { apiClient } from './api.ts'
import { WebStorageStateStore } from "oidc-client-ts";
import { urlAuth } from "./url.js";

const onSigninCallback = (_user: User | void): void => {
  if (_user) {
    apiClient.updateToken(_user.access_token);
  }
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  )
}

export const oidcConfig = {
  authority: urlAuth,
  client_id: "storage-web",
  redirect_uri: window.location.protocol + '//' + window.location.host,
  "onSigninCallback": onSigninCallback,
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  userStore: new WebStorageStateStore({ store: window.localStorage })
};