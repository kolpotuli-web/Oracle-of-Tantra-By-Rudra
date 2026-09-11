/* The Oracle of Tantra — generated visual asset registry. */
window.ORACLE_ASSETS = Object.freeze({
  /* Final clean desktop artwork: male Oracle, moon, river, books, black cat, no interface. */
  masterDesktop: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  /* Recomposed mobile artwork with the same male Oracle and black cat. */
  masterMobile: 'https://cdn.creativeclaw.co/u/486ee905/images/ca527432-87f0-46a9-b085-1a6d2c951dc9.png',
  oracle: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  bookshelf: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  centralArch: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  objectsSprite: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  local: {
    masterDesktop: 'assets/generated/oracle-tantra-master-desktop.png',
    masterMobile: 'assets/generated/oracle-tantra-master-mobile.png',
    oracle: 'assets/generated/oracle-tantra-oracle.png',
    bookshelf: 'assets/generated/oracle-tantra-bookshelf.png',
    centralArch: 'assets/generated/oracle-tantra-central-arch.png',
    objectsSprite: 'assets/generated/oracle-tantra-objects.png'
  }
});

/* Authentication is kept in a separate module so the painting and interface stay decoupled. */
const authScript = document.createElement('script');
authScript.type = 'module';
authScript.src = 'assets/oracle-auth.js';
document.head.appendChild(authScript);
