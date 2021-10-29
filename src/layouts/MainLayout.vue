<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered>
      <q-toolbar class="constrain">
        <q-btn
          flat
          round
          dense
          to="/camera"
          icon="eva-camera-outline"
          size="18px"
          class="large-screen-only q-mr-sm q-mt-sm"
        />
        <q-separator vertical spaced class="large-screen-only" />
        <q-toolbar-title class="text-grand-hotel text-bold">
          Quasagram
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          to="/"
          icon="eva-home-outline"
          size="18px"
          class="large-screen-only q-mt-sm"
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-white" bordered>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <div v-if="showAppInstallBanner" class="banner-container bg-primary">
          <div class="constrain">
            <q-banner class="bg-primary text-white" inline-actions dense>
              <template v-slot:avatar>
                <q-avatar
                  color="white"
                  icon="eva-camera-outline"
                  text-color="grey-10"
                  font-size="22px"
                />
              </template>
              <b>Install Quasagram?</b>

              <template v-slot:action>
                <q-btn
                  dense
                  flat
                  class="q-px-sm"
                  label="Yes"
                  @click="installApp"
                />
                <q-btn
                  dense
                  flat
                  class="q-px-sm"
                  label="Later"
                  @click="showAppInstallBanner = false"
                />
                <q-btn
                  dense
                  flat
                  class="q-px-sm"
                  label="Never"
                  @click="neverShowAppInstallBanner"
                />
              </template>
            </q-banner>
          </div>
        </div>
      </transition>
      <q-tabs class="text-grey-10 small-screen-only" active-color="primary">
        <q-route-tab to="/" icon="eva-home-outline" />
        <q-route-tab to="/camera" icon="eva-camera-outline" />
      </q-tabs>
    </q-footer>

    <q-page-container class="bg-grey-1">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['PageHome']">
          <component :is="Component"></component>
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
// Initialize deferredPrompt for use later to show browser install prompt.
let deferredPrompt;

export default {
  name: "MainLayout",

  data() {
    return {
      showAppInstallBanner: false,
    };
  },
  mounted() {
    let neverShowAppInstallBanner =
      this.$q.localStorage.getItem("neverShowAppInstallBanner") || false;

    if (!neverShowAppInstallBanner) {
      window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() => {
          this.showAppInstallBanner = true;
        }, 3000);
        // Optionally, send analytics event that PWA install promo was shown.
        console.log(`'beforeinstallprompt' event was fired.`);
      });
    }
  },
  methods: {
    installApp() {
      // Hide the app provided install promotion
      this.showAppInstallBanner = false;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          this.neverShowAppInstallBanner();
        }
        // Optionally, send analytics event with outcome of user choice
        console.log(
          `User response to the install prompt: ${choiceResult.outcome}`
        );
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
      });
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false;
      this.$q.localStorage.set("neverShowAppInstallBanner", true);
    },
  },
};
</script>
<style lang="scss">
.q-toolbar {
  @media (min-width: $breakpoint-sm-min) {
    height: 77px;
  }
}
.q-toolbar__title {
  font-size: 30px;
  @media (max-width: $breakpoint-xs-max) {
    text-align: center;
  }
}

.q-footer {
  .q-tab__icon {
    font-size: 30px;
  }
}
.platform-ios {
  .q-footer {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
