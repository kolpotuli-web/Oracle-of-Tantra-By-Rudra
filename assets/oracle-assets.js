/* The Oracle of Tantra — generated visual asset registry. */
window.ORACLE_ASSETS = Object.freeze({
  /* Clean text-free master from the supplied moonlit manuscript reference. */
  masterDesktop: 'https://cdn.creativeclaw.co/u/486ee905/images/42ff144d-e663-4530-b684-70ace2ad0067.png',
  /* Dedicated male-oracle mobile artwork can replace this when Creative Claw credits are available. */
  masterMobile: 'https://cdn.creativeclaw.co/u/486ee905/images/42ff144d-e663-4530-b684-70ace2ad0067.png',
  oracle: 'https://cdn.creativeclaw.co/u/486ee905/images/5fb0c5ee-0cc5-4b28-9544-dd6491aaac49.png',
  bookshelf: 'https://cdn.creativeclaw.co/u/486ee905/images/b4f990dc-08ad-42b1-a2b2-e4720ff21462.png',
  centralArch: 'https://cdn.creativeclaw.co/u/486ee905/images/73bf3975-c1ec-4596-968c-afbb138f2fbe.png',
  objectsSprite: 'https://cdn.creativeclaw.co/u/486ee905/images/75381525-d868-456f-ae32-5ee1df2fdee0.png',
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
