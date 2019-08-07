/**
 * EmailScrape will scrape the emails, relies on MTurkScript
 */
function ScrapeEmails(url) {
    if(typeof MTurkScript!=='function') {
	console.log("MTurkScript not defined yet on call of ScrapeEmails!");
	return;
    }
    this.url=url.replace(/\/$/,"");

}
