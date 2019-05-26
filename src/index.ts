import { wait } from "@hediet/std/timer";
import fetch from "node-fetch";
import { newConfigDescription } from "@hediet/config";
import { type, string } from "io-ts";
import inwx from "inwx";

const constigDescription = newConfigDescription({
	appId: "nameserver-updater",
	configFilePath: process.argv[2],
	type: type({
		username: string,
		password: string,
	}),
});

const config = constigDescription.load();

main();

async function main() {
	let lastIp: string | undefined = undefined;
	while (true) {
		const ip = await getIp();

		if (ip && lastIp !== ip) {
			setIp(ip);
			lastIp = ip;
		}

		await wait(15 * 1000);
	}
}

async function getIp(): Promise<string | undefined> {
	try {
		return getIp1();
	} catch (e) {
		console.error(e);
	}
	try {
		return getIp2();
	} catch (e) {
		console.error(e);
	}

	return undefined;
}

async function getIp1(): Promise<string> {
	const resp = await fetch("https://api.ipify.org/?format=json");
	const json = await resp.json();
	return json.ip;
}

async function getIp2(): Promise<string> {
	const resp = await fetch("http://ipv4bot.whatismyipaddress.com/");
	const ip = await resp.text();
	return ip;
}

async function setIp(newIp: string): Promise<void> {
	inwx(
		{ api: "production", user: config.username, password: config.password },
		function(api: any) {
			api.nameserverRecordHelper(
				"hediet.de",
				"update",
				{ content: newIp },
				{ type: "A", name: "" },
				function(response: any) {
					console.log(`Updated ip to ${newIp}`);
					api.close();
				}
			);
		}
	);
}
