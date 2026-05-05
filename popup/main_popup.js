let groups = [];

async function loadGroups() {
	groups = JSON.parse((await browser.storage.local.get("savedGroups"))["savedGroups"] || "[]")
}

async function saveGroups() {
	await browser.storage.local.set({savedGroups: JSON.stringify(groups)});
}

function getCurrentWindowTabs() {
	return browser.tabs.query({currentWindow: true});
}

async function getCurrentWindowData() {
	const tabs = await getCurrentWindowTabs();
	return tabs.map((tab) => {
		return {
			title: tab.title,
			url: tab.url,
		};
	});
}

async function openTablist(group_name) {
	const this_group = groups.find((group) => group.name === group_name);
	const tabs = this_group.urls;
	for (let i = 0; i < tabs.length; i++) {
		const tab_url = tabs[i];
		if (tab_url.startsWith("about:")) {
			continue;
		}
		await browser.tabs.create({
			url: tab_url,
		})
	}
}

function deleteGroup(group_name) {
	groups = groups.filter((group) => group.name !== group_name);
	saveGroups().then(() => {
		reloadList().then();
	});
}

async function reloadList() {
	const groups_container = $("#groups");
	groups_container.empty();

	await loadGroups();

	for (let i = 0; i < groups.length; i++) {
		const this_group = groups[i];
		const group_name = this_group.name;

		const main_div = $(`<div class="group" id="group_${i}"></div>`);
		const load_button = $(`<button class="group-button">Open ${group_name}</button>`).on("click", () => {
			openTablist(group_name);
		});
		const delete_button = $(`<button class="delete-button">Delete</button>`).on("click", () => {
			deleteGroup(group_name);
		})
		main_div.append(load_button);
		main_div.append(delete_button);
		groups_container.append(main_div);
	}
}

$("#create-group-button").on("click", async () => {
	const group_name = $("#group-name-input").val();
	const group_urls = (await getCurrentWindowData()).map((tab) => tab.url);

	let updated = false;
	for (let i = 0; i < groups.length; i++) {
		if (groups[i].name === group_name) {
			groups[i].urls = group_urls;
			updated = true;
		}
	}

	if (!updated) {
		groups.push({
			name: group_name,
			urls: group_urls,
		});
	}

	saveGroups().then(() => {
		reloadList().then();
	});
});

$("#test").on("click", () => {
	getCurrentWindowData().then();
});

document.addEventListener("DOMContentLoaded", () => {
	reloadList().then();
});