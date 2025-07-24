import { hash } from 'argon2-browser';

function password_to_hash(password) {
    argon2.hash({ pass: password, salt: 'z./fo[]$' })
    .then(h => console.log(h.hash, h.hashHex, h.encoded))
    .catch(e => console.error(e.message, e.code))
}