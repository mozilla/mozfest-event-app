/* global alert, console */
"use strict";
// Install app
if (navigator.mozApps) {
  var install = document.querySelector("#install");
  var checkIfInstalled = navigator.mozApps.getSelf();
  checkIfInstalled.onsuccess = function () {
	if (!checkIfInstalled.result) {
	  install.className = "";
	  var manifestURL = location.href.substring(0, location.href.lastIndexOf("/")) + "/manifest.webapp";
	  install.onclick = function () {
		var installApp = navigator.mozApps.install(manifestURL);
		installApp.onsuccess = function () {
		  install.style.display = "none";
		};
		installApp.onerror = function () {
		  alert("Install failed\n\n:" + installApp.error.name);
		};
	  };
	} 
  };
  checkIfInstalled.onerror = function () {
	install.className = "";
  };
} else {
  console.log("Open Web Apps not supported");
}
