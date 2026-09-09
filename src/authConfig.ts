import { User, WebStorageStateStore } from "oidc-client-ts"
import { apiClient } from './api.ts'
import { urlAuth } from "./url.js"
import { type AuthProviderProps } from "react-oidc-context"

const onSigninCallback = (user: User | void): void => {
  if (user) {
    apiClient.updateToken(user.access_token);
  }
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  )
}

let scope = 'openid';
if (window.parent != window || true) {
  scope += ' trust';
}

export const oidcConfig: AuthProviderProps = {
  authority: urlAuth,
  client_id: "storage-web",
  redirect_uri: window.location.origin + window.location.pathname,
  post_logout_redirect_uri: window.location.origin + window.location.pathname,
  automaticSilentRenew: true,
  onSigninCallback: onSigninCallback,
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  scope: scope
};