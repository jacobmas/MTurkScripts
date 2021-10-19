var state_map={"Alabama":"AL","Alaska":"AK","American Samoa":"AS", "Arizona":"AZ","Arkansas":"AR",
	       "California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE",
	       "District of Columbia": "DC", "Florida": "FL","Georgia": "GA", "Guam":"GU", "Hawaii": "HI",
	       "Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas": "KS", "Kentucky": "KY",
	       "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts":"MA", "Michigan": "MI",
               "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE",
	       "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
	       "North Carolina": "NC", "North Dakota": "ND", "Northern Mariana Islands":"MP", "Ohio": "OH",
               "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA","Puerto Rico":"PR",
	       "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD","Tennessee": "TN",
	       "Texas": "TX", "Utah": "UT","Virgin Islands":"VI", "Vermont": "VT", "Virginia": "VA",
	       "Washington": "WA", "West Virginia": "WV","Wisconsin": "WI", "Wyoming": "WY",
	      };
var province_map={"Alberta": "AB", "British Columbia": "BC", "Manitoba": "MB", "New Brunswick": "NB",
		  "Newfoundland and Labrador":"NL","Northwest Territories":"NT","Nova Scotia": "NS",
		  "Nunavut":"NU", "Ontario": "ON", "Prince Edward Island":"PE", "Quebec": "QC",
		  "Saskatchewan": "SK","Yukon":"YT"
		 };

var email_domain_only_str="(^([\\d]{3}\\.com|163\\.com|aol\\.com|aon\\.at|"+
    "bigpond\\.(com|net)\\.au|bk\\.ru|bluewin\\.ch|btopenworld\\.com|"+
    "cableone\\.net|charter\\.net|comcast\\.net|"+
    "cox\\.net|earthlink\\.net|emirates\\.net\\.ae|free\\.fr|freenet\\.de|fuse\\.net|"+
    "gmail\\.com|gmx\\.(at|ch|de|net)|hush\\.com|ig\\.com\\.br|knology\\.net|"+
    "libero\\.it|live\\.(ca|co\\.uk|de)|live\\.cn|live\\.nl|list\\.ru|"+
    "mac\\.com|mail\\.de|mindspring\\.com|mweb\\.co\\.za|"+
    "online\.no|optusnet\\.com\\.au|(.*net\\.com)|orange\\.fr|"+
    "pacbell\\.net|protonmail\\.com|qq\\.com|rocketmail\\.com|rogers\\.com|([^\\.]*\\.rr\\.com)|runbox\\.com|"+
    "sbcglobal\\.net|seznam\\.cz|shaw\\.ca|sternemails\\.com|suddenlink\\.net|"+
    "swissmail\.org|sympatico\\.ca|tbaytel\\.net|telkomsa\\.net|telus\\.net|uol\\.com\\.br|"+
    "verizon\\.net|walla\.com|wanadoo\\.fr|web\\.de|windstream\\.net|ya(ndex)?\\.ru|yahoo\\.com|ymail\\.com"+
    "))$";

var email_domain_only_re=new RegExp(email_domain_only_str,"i");




var reverse_state_map={},reverse_province_map={};
for(let x in state_map)     reverse_state_map[state_map[x]]=x;
for(let x in province_map)     reverse_province_map[province_map[x]]=x;

var default_bad_urls=[".alibaba.com",".amazonaws.com",".business.site",".crunchbase.com",".dictionary.com","facebook.com",".google.com",
		      "instagram.com",".medium.com",".mturkcontent.com",".mylife.com",".opencorporates.com","opendi.us","peekyou.com",
		      "plus.google.com",".spokeo.com",".thefreedictionary.com",".trystuff.com",
		      "twitter.com",
		      ".urbandictionary.com",".vimeo.com","youtube.com",
			  '.healthgrades.com','.vitals.com','.medicarelist.com','.healthcare4ppl.com','.yelp.com','.zocdoc.com',
                 '.npidb.com','/npino.com','.ehealthscores.com','/npiprofile.com','/healthprovidersdata.com','.usnews.com','.doximity.com',
                 '.linkedin.com','.sharecare.com','.caredash.com','.healthcare6.com','.topnpi.com','.webmd.com','.md.com','.yellowpages.com','researchgate.net',
                 '.corporationwiki.com','.medicinenet.com','.wellness.com','mturkcontent.com','/issuu.com','washingtonpost.com','.hrt.org','findatopdoc.com','.wiley.com',"mturkcontent.com",".webmd.com",".healthgrades.com",'.healthgrades.com','.vitals.com','.medicarelist.com','.healthcare4ppl.com','.yelp.com','.zocdoc.com',
                 '.npidb.com','/npino.com','.ehealthscores.com','/npiprofile.com','/healthprovidersdata.com','.usnews.com','.doximity.com',
                 '.linkedin.com','.sharecare.com','.caredash.com','.healthcare6.com','.topnpi.com','.webmd.com','.md.com','.yellowpages.com',".whitepages.com",
                 '.corporationwiki.com','.medicinenet.com','orthopedic.io','.mylife.com','eyedoctor.io','.wellness.com','nuwber.com','.findatopdoc.com',
                 '.healthlynked.com','.spokeo.com','/obituaries/'];

/* Regular expressions for emails, phones, faxes */
var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;
var phone_re=/[\+]?[\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*(x|ext\.?)\s*[\d]{1,5})?/im;
var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;
var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
var defaultDiacriticsRemovalMap = [
    {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
    {'base':'AA','letters':'\uA732'},{'base':'AE','letters':'\u00C6\u01FC\u01E2'},{'base':'AO','letters':'\uA734'},
    {'base':'AU','letters':'\uA736'},{'base':'AV','letters':'\uA738\uA73A'},{'base':'AY','letters':'\uA73C'},
    {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},{'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'}, {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0'},
    {'base':'DZ','letters':'\u01F1\u01C4'},{'base':'Dz','letters':'\u01F2\u01C5'},
    {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
    {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
    {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
    {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
    {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
    {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
    {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
    {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
    {'base':'LJ','letters':'\u01C7'},{'base':'Lj','letters':'\u01C8'},
    {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
    {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
    {'base':'NJ','letters':'\u01CA'},{'base':'Nj','letters':'\u01CB'},
    {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'}, {'base':'OI','letters':'\u01A2'}, {'base':'OO','letters':'\uA74E'}, {'base':'OU','letters':'\u0222'},
    {'base':'OE','letters':'\u008C\u0152'}, {'base':'oe','letters':'\u009C\u0153'},
    {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
    {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
    {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
    {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
    {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
    {'base':'TZ','letters':'\uA728'},
    {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
    {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},{'base':'VY','letters':'\uA760'},
    {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
    {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
    {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
    {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
    {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
    {'base':'aa','letters':'\uA733'},{'base':'ae','letters':'\u00E6\u01FD\u01E3'},{'base':'ao','letters':'\uA735'},
    {'base':'au','letters':'\uA737'},{'base':'av','letters':'\uA739\uA73B'},{'base':'ay','letters':'\uA73D'},
    {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
    {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
    {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
    {'base':'dz','letters':'\u01F3\u01C6'},
    {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
    {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
    {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
    {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
    {'base':'hv','letters':'\u0195'},
    {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},{'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
    {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
    {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},{'base':'lj','letters':'\u01C9'},
    {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
    {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
    {'base':'nj','letters':'\u01CC'},
    {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
    {'base':'oi','letters':'\u01A3'},{'base':'ou','letters':'\u0223'},{'base':'oo','letters':'\uA74F'},
    {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
    {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
    {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
    {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
    {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
    {'base':'tz','letters':'\uA729'},
    {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
    {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},{'base':'vy','letters':'\uA761'},
    {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
    {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
    {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
    {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}];
var diacriticsMap = {};
for (var i=0; i < defaultDiacriticsRemovalMap .length; i++){
    var letters = defaultDiacriticsRemovalMap [i].letters;
    for (var j=0; j < letters.length ; j++) diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap [i].base;
}

/* return_ms is the number of milliseconds to wait before returning the HIT,
 * submit_ms is the number of milliseconds to wait before submitting the HIT
 * sites should be a list of {fragment:this.sites[x],timeout:2000} type objects
 sites we will be doing standardized scraping off of
 * callback is the init_Query type function to initialize the custom part of the script running
 * requester_id is the MTurk id of the requester so it doesn't accidentally run on wrong HITs
 * is_crowd is for this new crowd shit 
 */
function MTurkScript(return_ms,submit_ms,sites,callback,requester_id,is_crowd) {
    var x,term_map={"return_ms":return_ms,"sites":sites,"submit_ms":submit_ms,"is_crowd":is_crowd,"query":{},"attempts":{},
		    "queryList":[],"doneQueries":0,"requester_id":requester_id,globalCSS:GM_getResourceText("globalCSS"),"submitted":false},curr_site;
    Object.assign(this,term_map);
    this.site_parser_map={"bloomberg.com/research/stocks/private/snapshot.asp":this.parseext_bloomberg_snapshot,
                          "bloomberg.com/profiles/companies/":this.parseext_bloomberg_profile,
                          "instagram.com":this.parseext_instagram};
    for(x in this.site_parser_map) this.attempts[x]=0;
    for(x=0; x<this.sites.length; x++) {
        console.log("x="+x+"\t"+this.sites[x].fragment);
        /* Only needs to be right domain at least for now */
        if(this.site_parser_map[this.sites[x].fragment]!==undefined &&
           window.location.href.indexOf(this.sites[x].fragment.replace(/\/.*$/,""))!==-1) {
            console.log("Initializing with "+this.sites[x].fragment);
            GM_setValue(this.sites[x].fragment+"_url","");
            GM_addValueChangeListener(this.sites[x].fragment+"_url",function() { window.location.href=arguments[2]; });
            if(window.location.href.indexOf(this.sites[x].fragment)!==-1) {
                console.log("Calling parser for "+x);
                setTimeout(this.site_parser_map[this.sites[x].fragment],this.sites[x].timeout,document,this,this.sites[x].fragment);
            }
        }
    }
    if ((window.location.href.indexOf("mturkcontent.com") !== -1 ||
         window.location.href.indexOf("amazonaws.com") !== -1) &&
        ((!is_crowd && document.getElementById("submitButton") && !document.getElementById("submitButton").disabled) ||
	 (is_crowd && this.is_crowd_ready())) &&
	GM_getValue("req_id","")===this.requester_id) {
	this.submit_button=is_crowd?(document.querySelector("crowd-button")||
				     document.querySelector("#footerContainer awsui-button button"))
				     :document.getElementById("submitButton");
	let assignmentId=document.querySelector("#assignmentId");
	if(assignmentId) this.assignment_id=assignmentId.value;
	else { console.log("No assignmentId found"); }
	callback();
    }
    else if((window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
	    && is_crowd && GM_getValue("req_id","")===this.requester_id) this.begin_crowd_script(200,0,callback,this);
    if(window.location.href.indexOf("worker.mturk.com")!==-1) {
	var match=window.location.href.match(/\?assignment_id\=([A-Z0-9]*)/);
	this.assignment_id=match?match[1]:"";
	console.log("this.assignment_id="+this.assignment_id);
	this.setup_worker_mturk();
    }
	
};

MTurkScript.prototype.is_crowd_ready=function() {
    if(document.querySelector("crowd-button") && !document.querySelector("crowd-button").disabled) return true;
    else if(document.querySelector("crowd-classifier") && !document.querySelector("crowd-classifier").disabled) return true;
    else if(document.querySelector("button#btnSubmit") && !document.querySelector("button#btnSubmit").disabled) return true;
    else {
	console.log(document.querySelector("button#btnSubmit")); }
    return false;
};


MTurkScript.prototype.setup_worker_mturk=function() {
    var self=this;
    this.submitted=false;
    GM_setValue("submitted",false);
    console.log("In setup_worker_mturk, this.assignment_id="+this.assignment_id);
    GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
    var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
    var req_id=document.querySelector(".project-detail-bar span.detail-bar-value a").href.match(/requesters\/([^\/]+)/);
    if(req_id && req_id[1]===this.requester_id) GM_setValue("req_id",req_id[1]);
    else { console.log("Wrong requester: found "+req_id[1]+", desired "+this.requester_id);
	   this.right_requester=false;
	   return; }
    
    if(GM_getValue("automate")===undefined) GM_setValue("automate",false);
    var btn_span=document.createElement("span"), btn_automate=document.createElement("button");
    var btn_primary=document.querySelector(".btn-primary"),btn_secondary=document.querySelector(".btn-secondary");
    var my_secondary_parent=pipeline.querySelector(".btn-secondary").parentNode;
    Object.assign(btn_automate,{className:"btn btn-ternary m-r-sm",innerHTML:"Automate"});
    btn_span.appendChild(btn_automate);
    pipeline.insertBefore(btn_span, my_secondary_parent);
    GM_addStyle(this.globalCSS);
    if(GM_getValue("automate") && ((btn_automate.innerHTML="Stop")||true)) {
        /* Return automatically if still automating according to return_ms */
        setTimeout(function() {  if(GM_getValue("automate") && !GM_getValue("submitted")) btn_secondary.click(); }, this.return_ms);
    }
    btn_automate.addEventListener("click", function(e) {
        var auto=GM_getValue("automate");
        if(!auto) btn_automate.innerHTML="Stop";
        else btn_automate.innerHTML="Automate";
        GM_setValue("automate",!auto);
    });
    GM_setValue("returnHit",false);
    GM_addValueChangeListener("returnHit", function() {
	console.log("this.assignment_id="+this.assignment_id+", arguments="+JSON.stringify(arguments));
	var assignment_id=arguments[0].replace(/^returnHit/,"");
	if(arguments[2]!==undefined) {
	    try { GM_deleteValue(arguments[0]); } catch(error) { }
            if(!self.submitted && 
		btn_secondary && btn_secondary.innerText==="Return" && (GM_getValue("automate"))) {
		
		setTimeout(function() { btn_secondary.click(); }, 0); 
            }
	}
    });
    
    if(btn_secondary && btn_secondary.innerText==="Skip" && btn_primary && btn_primary.innerText==="Accept") {
        /* Accept the HIT if automating */
        if(GM_getValue("automate")) btn_primary.click(); 
    }
    else {
        /* Wait to return the hit */
        var cbox=document.querySelector(".checkbox input[type='checkbox']");
        if(cbox && !cbox.checked) cbox.click();
    }
};
MTurkScript.prototype.check_and_submit=function(check_function)	{
    console.log("in check");
    var submit_button=this.is_crowd?document.querySelector("crowd-button"):document.getElementById("submitButton");
    if(!submit_button) submit_button=document.querySelector("input[type='submit']");
    if(check_function!==undefined && !check_function()) {
        GM_setValue("returnHit"+this.assignment_id,true);
        console.log("bad");
        return;
    }
    console.log("Checking and submitting "+this.assignment_id);
    GM_deleteValue("returnHit"+this.assignment_id);
    if(GM_getValue("automate")) setTimeout(function() { submit_button.click(); }, this.submit_ms);
};
MTurkScript.prototype.swrot13=function(str) {
    var ret="",i;
    for(i=0; i < str.length; i++) {
        if (/[a-z]/.test(str.charAt(i))) ret+=String.fromCharCode(((str.charCodeAt(i)-"a".charCodeAt(0)+13)%26)+"a".charCodeAt(0));
        else ret=ret+str.charAt(i);
    }
    return ret;
};
/* Begin a script using the crowd plugin */
MTurkScript.prototype.begin_crowd_script=function(timeout,total_time,callback,self) {
    let assignmentId=window.location.href.match(/assignmentId\=([A-Z0-9]*)/);
    if(assignmentId) this.assignment_id=assignmentId[1];
    else { console.log("No assignmentId found"); }
    if((document.querySelector("crowd-button") && !document.querySelector("crowd-button").disabled) || self.is_crowd_ready()) {
	self.submit_button=document.querySelector("crowd-button");
	console.log("self.submit_button="+self.submit_button);
	console.log(self);
	let assignmentId=document.querySelector("#assignmentId");
	if(assignmentId) this.assignment_id=assignmentId.value;
	callback();
    }
    else if(total_time<2000) {
        console.log("total_time="+total_time);
        total_time+=timeout;
        setTimeout(function() { self.begin_crowd_script(timeout,total_time,callback,self); },timeout);
        return;
    }
    else console.log("Failed to begin crowd script");
};
MTurkScript.prototype.removeDiacritics=function(str) {
    return str.replace(/[^\u0000-\u007E]/g, function(a) { return diacriticsMap[a] || a; });
};
MTurkScript.prototype.DeCryptString = function(s) {
    var n = 0,r = "mailto:",z = 0;
    for( var i = 0; i < s.length/2; i++) {
        z = s.substr(i*2, 1);
        n = s.charCodeAt( i*2+1 );
        if( n >= 8364 ) n = 128;
        r += String.fromCharCode( n - z );
    }
    return r;
};
/* DecryptX decrypts certain types of email */
MTurkScript.prototype.DeCryptX=function(s) { return this.DeCryptString( s ); };
/* cfDecodeEmail decodes Cloudflare encoded emails */
MTurkScript.prototype.cfDecodeEmail=function(encodedString) {
    var email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
    for (n = 2;n<encodedString.length; n += 2){
        i = parseInt(encodedString.substr(n, 2), 16) ^ r;
        email += String.fromCharCode(i);
    }
    return email;
};
/* Some basic checks for improper emails beyond email_re */
MTurkScript.prototype.is_bad_email=function(to_check) {
   // console.log("to_check="+to_check);
    to_check=to_check.toLowerCase();
    if(to_check.indexOf("@2x.png")!==-1 || to_check.indexOf("@2x.jpg")!==-1 || to_check.indexOf("@2x.yelp")!==-1) return true;
    else if(/\.(png|jpg|jpeg|gif)$/.test(to_check)) return true;
    else if(to_check.indexOf("s3.amazonaws.com")!==-1) return true;
    else if(/(@((godaddy|domain|addresshere|emailaddress|address)\.com|example\.com))|(^example@)/i.test(to_check)) return true;
    else if(/;/.test(to_check)) return true;
    else if(/^(sample@|youremail)/.test(to_check)) return true;
    else if(/(^(yourname|root)@)|localhost\.localhost/.test(to_check)) return true;
    else if(/(jacobmas|democraticluntz|fredthelinkedinfred|siviliamshumpkins)@gmail\.com|user@domain\.name/.test(to_check)) return true;
    else if(/@(example|email|wix|yourcompany)\.com$/.test(to_check)) return true;
   // else if(!to_check.match(email_re)) return true;
    return false;
}
/**
 * the_url the url to check for "being good"
 * bad_urls a list of strings which are invalid for a "good url"
 * max_depth the maximum number of split positions when splitting by "/", will always be 3+ for a
 *         valid url
 * max_dashes the maximum number of dashes in the http://www.website.com/[number of dashes here]/
 * to identify a bad aggreggating type url
 */
MTurkScript.prototype.is_bad_url=function(the_url, bad_urls, max_depth, max_dashes)
{
    var i,dash_split,do_dashes,slash_split;
    the_url=the_url.replace(/\/$/,"")
	.replace(/(https?:\/\/[^\/]*)\/en(\/.*|)$/,"$1");
    if(max_depth===undefined) max_depth=4;
    if(max_dashes===undefined || max_dashes===-1) do_dashes=false;
    else do_dashes=true;
    for(i=0; i < bad_urls.length; i++) {
        if(the_url.indexOf(bad_urls[i])!==-1) return true;
    }
    // -1 means we just check for specific bad stuff, not length
    if(max_depth!==-1 && the_url.split("/").length>max_depth) return true;
    if((slash_split=the_url.split("/")).length >= 4 && do_dashes) {
	for(i=3;i<slash_split.length;i++) {
	    if(slash_split[i].split("-").length>max_dashes||slash_split[i].split("_").length>max_dashes||
	       slash_split[i].split("+").length>max_dashes) return true;   
	}
    }
}

/* TODO: Can be improved greatly, need a good way to parse addresses globally */
MTurkScript.prototype.my_parse_address=function(to_parse)
{
    var ret_add={street:""},my_match,state_re=/([A-Za-z]+) ([\d\-]+)$/;
    var canada_zip=/ ([A-Z]{2}) ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
    to_parse=to_parse.replace(canada_zip,", $&");
    console.log("to_parse="+to_parse);
    var splits=to_parse.split(","),s_len;
    if((s_len=splits.length)>=2 && s_len<=3) {
        if((my_match=splits[s_len-1].match(canada_zip))||(my_match=splits[s_len-1].match(state_re))) {
	    Object.assign(ret_add,{state:my_match[1],zip:my_match[2]}); }
	Object.assign(ret_add,{street:(s_len===3 ? splits[0].trim() : ""),city:splits[s_len-2].trim()});
    }
    if(ret_add.city===undefined || ret_add.state===undefined || ret_add.zip===undefined) {
        to_parse=to_parse.replace(/\, ([\d]{5})\,? ([A-Z]{2})/, ", $2 $1");
        console.log("to_parse="+to_parse);
        var new_add=parseAddress.parseLocation(to_parse);
        if(new_add.number!==undefined) ret_add.street=ret_add.street+new_add.number+" ";
        ret_add.street=ret_add.street+new_add.street+" ";
        if(new_add.type!==undefined) ret_add.street=ret_add.street+new_add.type;
        Object.assign(ret_add,{street:ret_add.street.trim(),city:new_add.city,state:new_add.state,zip:new_add.zip?new_add.zip:""});
        console.log("new_add="+JSON.stringify(new_add));
    }
    return ret_add;
}
/* get_domain_only gets the domain from a url, if lim_one is true it tries to really get just the domain 
  i.e. from http://www.fuckingnonsense.goodsite.com it would get "goodsite.com", or 
  http://www.rightfuckingnonsense.goodsite.co.uk it would get "goodsite.co.uk" */
MTurkScript.prototype.get_domain_only=function(the_url,lim_one) {
    var httpwww_re=/https?:\/\/www\./,http_re=/https?:\/\//,slash_re=/\/.*$/;
    var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
    if(lim_one && /\.(co|ac|gov|com|org)\.[A-Za-z]{2}$/i.test(ret)) ret=ret.replace(/^.*\.([^\.]+\.(?:co|ac|gov)\.[A-Za-z]{2})$/,"$1");
    //    else if(lim_one && /^[^\.]+\.[^\.]+(\.[a-z]{2}\.us)$/i) ret=ret;
    else if(lim_one && (/\.k12\.[a-z]{2}\.us$/i.test(ret))) ret=ret.replace(/^.*\.([^\.]+\.k12\.[a-z]{2}\.us$)/,"$1");
    else if(lim_one) ret=ret.replace(/^.*\.([^\.]+\.[^\.]+$)/,"$1");
    return ret;
}
MTurkScript.prototype.prefix_in_string=function(prefixes, to_check) {
    for(var j=0; j < prefixes.length; j++) if(to_check.indexOf(prefixes[j])===0) return true;
    return false;
}
/* Parse a person's name, somewhat exhaustive */
MTurkScript.prototype.parse_name=function(to_parse) {
    //console.log("Doing parse_name on "+to_parse);
    var first_pos=0,j,last,ret={};
    var suffixes=[/^Jr\.?/i,/^II$/i,/^III$/i,/^IV$/i,/^CPA$/i,/^CGM$/i,/^Sr\.?$/i],prefixes=["Mr","Ms","Mrs","Dr","Rev"],split_parse;
    var prefixes_regex=/^(Mr|Ms|Mrs|Dr|Rev|Miss)\.?\s+/gi,paren_regex=/\([^\)]*\)/g,caps_regex=/^[A-Z]+$/;
    var suffix_regex=/^((Jr\.?)|(II)|(III)|(IV)|(CPA)|(CGM)|(Sr\.?))$/i;
    to_parse=to_parse.replace(paren_regex,"").replace(prefixes_regex,"");
    split_parse=to_parse.split(" ");
    last=split_parse.length-1;
    for(last=split_parse.length-1; last>=1; last--) {
        if(!suffix_regex.test(split_parse[last]) &&
           !(split_parse.length>0 && /[A-Z][a-z]/.test(split_parse[0]) && /^[^a-z]+$/.test(split_parse[last]))) break;
    }
    if(last>=2 && /^(Van|de|Le|La|Von)$/i.test(split_parse[last-1])) ret.lname=split_parse[last-1]+" "+split_parse[last];
    else {
	if(last>0) ret.lname=split_parse[last].replace(/[^A-Za-z\']+$/,"");
	else if(split_parse.length>=2) {
	    /* must have skipped the last name */
	    ret.lname=split_parse[1].replace(/^(.)(.*)$/,function(match,p1,p2) {
		return p1.toUpperCase()+p2.toLowerCase(); });    
	}
	
    }
    ret.fname=split_parse[0];
    if(last>=2 && split_parse[1].length>=1) {
		ret.mname=split_parse[1];
		ret.minit=split_parse[1].substring(0,1);
	}
    else ret.mname="";
    return ret;
};

MTurkScript.prototype.shorten_company_name=function(name) {
    var first_suffix_str="(Pty Ltd(\\.)?)|Limited|LLC(\\.?)|KG|LLP";
    var first_regex=new RegExp("\\s+"+first_suffix_str+"$","ig");
    name=MTurkScript.prototype.removeDiacritics(name);
    name=name.replace(first_regex,"");
    name=name.replace(/ - .*$/,"").trim().replace(/\s*plc$/i,"");
    name=name.replace(/\(.*$/i,"").trim();
    name=name.replace(/\s*Corporation$/i,"").replace(/\s*Corp\.?$/i,"");
    name=name.replace(/\s*Incorporated$/i,"").replace(/\s*Inc\.?$/i,"");
    name=name.replace(/\s+LLC$/i,"").replace(/\s*Limited$/i,"").replace(/\s*Ltd\.?$/i,"").trim();
    name=name.replace(/,\s*$/,"").replace(/\s*LLP$/,"");;
    name=name.replace(/\s+Pte$/i,"").replace(/ AG$/i,"");
    name=name.replace(/\s+S\.?A\.?$/i,"").replace(/\s+L\.?P\.?$/i,"");
    name=name.replace(/\s+GmbH$/i,"").replace(/\s+SRL/i,"")
    name=name.replace(/\s+Sarl$/i,"").replace(/\s+KG/i,"");
    name=name.replace(/[,\.]+$/,"").replace(/\s+B(\.)?V(\.)?$/i,"");
    name=name.replace(/(&)?\sCo\.?$/i,"").trim();
    name=name.replace(/\s+GmBH$/i,"");
    return name;
}



/* reload_parser reloads the parser if the page hasn't parsed yet and we have attempts left
   (number of attempts is currently a magic number here of 30, timeout is 500 milliseconds
*/
MTurkScript.prototype.reload_parser=function(doc,instance,fragment)
{
    // console.log("func="+func);
    if(instance.attempts[fragment] < 30)
    {
        instance.attempts[fragment]++;
        setTimeout(instance.site_parser_map[fragment],500,doc,instance,fragment);
    }
}

/**
 * query_search does a Bing search
 * search_str is the actual search query that we're simulating typing into bing
 * resolve and reject come from a promise
 * callback is the function called to parse the result of xmlhttprequest (usually query_response)
 * type is a field denoting the "type" of query (since often multiples made per script)
 * filters denotes what to put into the filters field in the bing URI
 * caller allows an object to pass itself in
*/
MTurkScript.prototype.query_search=function(search_str, resolve,reject, callback,type,filters,caller) {
    console.log("Searching with bing for "+search_str);
    if(!filters) filters="";
    var search_URIBing='https://www.bing.com/search?q='+
        encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
    GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                       onload: function(response) { callback(response, resolve, reject,type,caller); },
                       onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                      });
};

MTurkScript.prototype.convertTime12to24 = (time12h) => {
        const [time, modifier] = time12h.split(' ');

        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = '00';
        }

        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }

        return `${hours}:${minutes}`;
    }

MTurkScript.prototype.parse_hours_table=function(table) {
	var row,col;
	var hours_dict={};
	for(row of table.tBodies[0].rows) {
		if(row.cells.length>=2) {
			var split_times=row.cells[1].innerText.trim().split(/ - /);
			if(split_times.length>=2) {
				split_times[0]=split_times[0].replace("Noon","12:00 PM").replace(/Midnight/i,"12:00 AM").replace(/^(\d+) /,"$1:00 ").replace(/^(\d:)/,"0$1");
				split_times[1]=split_times[1].replace("Noon","12:00 PM").replace(/Midnight/i,"12:00 AM").replace(/^(\d+) /,"$1:00 ").replace(/^(\d:)/,"0$1");

				var open24=MTurkScript.prototype.convertTime12to24(split_times[0]), close24=MTurkScript.prototype.convertTime12to24(split_times[1]);

				var curr_dict={"open":split_times[0],"close":split_times[1],"open24":open24,"close24":close24,"closed":false};

				hours_dict[row.cells[0].innerText.trim()]=curr_dict;
			}
			else if(/Closed/i.test(row.cells[1].innerText)) {
				hours_dict[row.cells[0].innerText.trim()]={"closed":true};
			}
			else {
				console.error("Error parsing hours dict, found ", row.cells[1].innerText, " as time");
			}


		}
	}
	return hours_dict;
}


/* parse_b_context parses the b_context on Bing search
   puts the b_vList fields (e.g. Address, Phone,Website) into the results under the
   name given on Bing,  puts b_entityTitle in Name
*/
MTurkScript.prototype.parse_b_context=function(b_context) {
    var b_vList,i,bm_details_overlay,b_entityTitle,b_entitySubTitle,b_subModule_h2,j;
    var b_hList=b_context.getElementsByClassName("b_hList"),inner_a,details,inner_li,split_exp,b_lower;
    var field_regex=/^([^:]+):\s*(.*)$/,field_match,disambig;
	var result={};
    var term_map={"Website":"url","Official site":"url","Company":"company"};
    var field_map=function(field) { return term_map[field]!==undefined?term_map[field]:field; };
    var b_entityTP=b_context.querySelector(".b_entityTP");
    var geochain=b_context.querySelectorAll(".geochainSegment");
    var parsed_entity,temp_span;
    var url,place,phone;
	var hours_table;
	if((hours_table=b_context.querySelector(".opHours table"))) {
		result.hours=MTurkScript.prototype.parse_hours_table(hours_table);
	}
	
	if((url=b_context.querySelector("a[href*='//www.imdb.com/']"))) result.imdb=url.href;
		
    if(b_context.querySelector("#permanentlyClosedIcon")) result.closed=true;
    disambig=b_context.querySelectorAll(".disambig-outline .b_slyGridItem");
    b_entityTitle=b_context.querySelector(".b_entityTitle");
    b_entitySubTitle=b_context.getElementsByClassName("b_entitySubTitle");
    if(b_entityTitle && (temp_span=b_entityTitle.querySelector("span")) && temp_span.title) result.Title=temp_span.title;
	else if(b_entityTitle) result.Title=b_entityTitle.innerText;
    if(b_entitySubTitle.length>0) {	
		result.SubTitle=b_entitySubTitle[0].parentNode.querySelector(".b_entityTitle")?b_entitySubTitle[0].innerText:b_entitySubTitle[0].parentNode.innerText;
	}
    if((b_vList=b_context.getElementsByClassName("b_vList")).length>0) {
        inner_li=b_vList[0].getElementsByTagName("li");
        for(i=0; i<inner_li.length; i++) {
            if(field_match=inner_li[i].innerText.match(field_regex)) result[field_map(field_match[1].trim())]=field_match[2];
        }
    }
	b_lower=b_context.querySelectorAll(".b_snippet_expansion");
	for(i=0; i<b_lower.length; i++) {
		if(field_match=b_lower[i].innerText.match(field_regex)) result[field_map(field_match[1].trim())]=field_match[2];
	}

	
	if(b_context.querySelector("#saplacesvg") && (place=b_context.querySelector("#saplacesvg").parentNode)) result['Address']=place.innerText.trim();
	if(b_context.querySelector("#sacallsvg") && (phone=b_context.querySelector("#sacallsvg").parentNode)) result['Phone']=phone.innerText.trim();
	MTurkScript.prototype.parse_b_infocardFactRows(b_context,result);
	
	
    if((url=b_context.querySelector("[aria-label='Website']"))) {
	result.url=url.href;
    }
    
	
    if((bm_details_overlay=b_context.getElementsByClassName("bm_details_overlay")).length>0) {
		try {
			
			details=JSON.parse(bm_details_overlay[0].dataset.detailsoverlay);
			result.latitude=details.centerLatitude;
			result.longitude=details.centerLongitude;
		}
		catch(error) {
			//console.log("Error parsing JSON=",error);
		}
    }
    b_subModule_h2=b_context.querySelectorAll(".b_subModule h2");
    for(i=0;i<b_subModule_h2.length; i++) {
        if(/Experience/.test(b_subModule_h2[i].innerText) && b_subModule_h2[i].nextElementSibling &&
           (inner_li=b_subModule_h2[i].nextElementSibling.querySelector("li"))) {
            split_exp=inner_li.innerText.split("\n");
            if(!result["Job title"]) result["Job title"]=split_exp[0].trim();
            if(split_exp.length>1&&!result.Company) result.Company=split_exp[1].replace(/\s*·.*$/,"");
        }
    }
    if(b_hList.length>0) {
        for(j=0;j<2&&j<b_hList.length;j++) {
            inner_a=b_hList[j].getElementsByTagName("a");
            for(i=0; i<inner_a.length; i++) result[field_map(inner_a[i].innerText.trim())]=inner_a[i].href;
        }
    }
    if(disambig.length>0) MTurkScript.prototype.parse_b_context_disambig(disambig,result);
    if(b_entityTP) {
	parsed_entity=MTurkScript.prototype.parse_entityTP(b_context);
	if((parsed_entity.type&&/Person/.test(parsed_entity.type))||(parsed_entity.experience&&parsed_entity.experience.length>0)) {
	    result.person=parsed_entity;
	    if(result.person.Location!==undefined) result.Location=result.person.Location;
	}
	else result.thing=parsed_entity;
    }
    if(geochain.length>0) {
	result.geochain=[];
	for(j of geochain) result.geochain.push(j.innerText.trim()); }
    MTurkScript.prototype.parse_b_footnote(b_context,result);
    return result;
};

/**
 * parse the b_infocardFactRows in the b_context 
 */
MTurkScript.prototype.parse_b_infocardFactRows=function(b_context,result) {
	var factRows=b_context.querySelectorAll('.b_infocardFactRows');
	var currRow, cbl, cbl_text;
	var wanted=['Address','Phone'];
	for(currRow of factRows) {
		if((cbl=currRow.querySelector(".cbl")) && (cbl_text=cbl.innerText.replace(/\:.*$/,"")) && (wanted.includes(cbl_text))) {
			cbl.parentNode.removeChild(cbl);
			result[cbl_text]=currRow.innerText;
		}
	}
};


MTurkScript.prototype.parse_b_footnote=function(b_context,result) {
    var b_footnote=b_context.querySelectorAll(".b_footnote a"),x;
    var site_map={"Yelp":/(^|\.)yelp\.(com|ca)/,"Facebook":/\.facebook\.com/},y;
    for(x of b_footnote) {
	for(y in site_map) {
	    if(site_map[y].test(x.href)) result[y]=x.href;
	}
    }	
};


MTurkScript.prototype.parse_b_context_disambig=function(disambig,result) {
    result.people=[];
    var wpc_eif,curr;
    for(curr of disambig) {
        let new_url=(curr.querySelector("a")?curr.querySelector("a").href:"").replace(/https?:\/\/[^\/]*/,"https://www.bing.com");
        let name=curr.querySelector(".b_secondaryFocus")?curr.querySelector(".b_secondaryFocus").innerText.trim():"";
        let title="",location="";
        wpc_eif=curr.querySelectorAll("li");
        if(wpc_eif.length>=2) {
            title=wpc_eif[0].innerText;
            location=wpc_eif[1].innerText;
        }
        else title=wpc_eif[0].innerText;
        result.people.push({url:new_url,name:name,title:title,location:location});
    }
};

MTurkScript.prototype.scrape_bing_experience=function(b_submodule) {
    var li=b_submodule.querySelectorAll(".b_vList li");
    var y,curr_job,match,z,str,split1,ret=[];
    for(y of li) {
        curr_job={};
        z=y.childNodes;
        if(z&&z.length>=3&&z[0].textContent && z[2].textContent) {                
            curr_job.title=z[0].textContent.trim();
            split1=z[2].textContent.trim().split(" · ");
	    Object.assign(curr_job,{company:split1[0],time:split1.length>1?split1[1]:""});
	    
	    if(curr_job.time.length>0) ret.push(curr_job);
        }
    }
    return ret;
};



MTurkScript.prototype.parse_entityTP=function(b_context) {
    var ret={};
    var b_entityTP=b_context.querySelector(".b_entityTP");
    var b_entityTitle,infoCard,about,x,match,b_subModule,b_entitySubTitle;
    var splspli,exp,prof,linkedinurl;
    if(!b_entityTP) return ret;
    b_entityTitle=b_entityTP.querySelector(".b_entityTitle");
    b_entitySubTitle=b_entityTP.querySelector(".b_entitySubTitle");
    b_subModule=b_entityTP.querySelectorAll(".b_subModule");
    if(b_entityTitle) ret.name=b_entityTitle.innerText;
    if(b_entitySubTitle) ret.type=b_entitySubTitle.parentNode.querySelector(".b_entityTitle")?b_entitySubTitle.innerText:b_entitySubTitle.parentNode.innerText;
    
    infoCard=b_entityTP.querySelectorAll(".infoCardIcons a");
    for(x of infoCard) {
        if(/linkedin\.com/.test(x.href)) ret.linkedin_url=x.href;
    }
    for(x of b_subModule) {
        let h2=x.querySelector("h2");
        if(h2&&h2.innerText.indexOf("Experience")!==-1) {
            ret.experience=MTurkScript.prototype.scrape_bing_experience(x);
        }
    }
    about=b_entityTP.querySelectorAll(".b_subModule .b_vList li");
    for(x of about) {
        match=x.innerText.trim().match(/^([^:]*):\s*(.*)$/);
        if(!match) continue;
        ret[match[1].trim()]=match[2];
    }
    prof=b_entityTP.querySelectorAll(".spl-spli-flt .b_entitySubTitle");
    if(prof.length>=1) ret.Location=prof[prof.length-1].innerText.trim();
    splspli=b_entityTP.querySelector(".spl-spli-dg");
    if((linkedinurl=b_entityTP.querySelector("div.spl-spli-connect a")) &&
       /LinkedIn/.test(linkedinurl.innerText)) ret.linkedin_url=linkedinurl.href;
   // console.log(splspli);
    if(splspli && (exp=splspli.querySelector("h2")) &&
       exp.innerText.indexOf("Experience")!==-1) ret.experience=MTurkScript.prototype.scrape_spli_experience(splspli);
    if(b_entityTP.dataset.feedbkIds==="Restaurant") ret.restaurant=MTurkScript.prototype.parse_bing_restaurant(b_entityTP);
    return ret;
};

MTurkScript.prototype.scrape_spli_experience=function(spli) {
    console.log("in scrape_split_experience")
    var grp=spli.querySelectorAll(".spl-spli-dg-group"),ret=[];
    var head,promote,demote,curr;
    for(curr of grp) {
        if(!(head=curr.querySelector(".spl-spli-dg-group-head"))) continue;
        promote=curr.querySelector(".splm-spli-dg-group-prp-highlight");
        demote=curr.querySelector(".b_demoteText");
        if(head && promote && demote) {
            ret.push({title:promote.innerText.trim(),company:head.innerText.trim(),time:demote.innerText.trim()});
        }   
    }
    return ret;
    
};

MTurkScript.prototype.parse_bing_restaurant=function(b_entityTP) {
    var ret={in_business:true},x,open_hrs=b_entityTP.querySelector("#mh_cdb_datagroupid_openhours");
    var footnote_sites=b_entityTP.querySelectorAll(".b_suppModule .b_footnote a");
    if(open_hrs) ret.in_business=true;
    if(b_entityTP.querySelector("#permanentlyClosedIcon")) ret.in_business=false;
    for(x of footnote_sites) ret[x.innerText.trim()]=x.href;
    return ret;
};

/**
 * parse b_factrow on bing 
 */
MTurkScript.prototype.parse_b_factrow=function(factrow) {
        var ret={},re=/^([^:]*):\s*(.*)$/,match;
        var lst=factrow.querySelectorAll("li"),x;
        for(x of lst) {
            if((match=x.innerText.trim().match(re)))  ret[match[1].trim()]=match[2].trim();
        }
        console.log("parse_b_factrow,ret="+JSON.stringify(ret));
        return ret;
};

MTurkScript.prototype.parse_lgb_info=function(lgb_info) {
    var result={"phone":"","name":"",url:"",address:""},bm_details_overlay,b_factrow,i,b_entityTitle,inner_a;
    b_entityTitle=lgb_info.getElementsByClassName("b_entityTitle");
	
	var hours_table;
	if((hours_table=lgb_info.querySelector(".opHours table"))) {
		result.hours=MTurkScript.prototype.parse_hours_table(hours_table);
	}
    bm_details_overlay=lgb_info.getElementsByClassName("bm_details_overlay");
    if(bm_details_overlay.length>0) result.address=bm_details_overlay[0].innerText;
    b_factrow=lgb_info.getElementsByClassName("b_factrow");
    if(b_entityTitle.length>0 && (result.name=b_entityTitle[0].innerText) &&
       (inner_a=b_entityTitle[0].getElementsByTagName("a")).length>0) result.url=inner_a[0].href;
    for(i=0; i < b_factrow.length; i++) {
        if(phone_re.test(b_factrow[i].innerText)||/^\+/.test(b_factrow[i].innerText)) result.phone=b_factrow[i].innerText;
    }
    if(!result.name && (inner_a=lgb_info.querySelector("h2 a"))) Object.assign(result,{url:inner_a.href,name:inner_a.innerText});
    return result;
};

/* parse loc_hy elements in Bing */
MTurkScript.prototype.parse_loc_hy=function(loc_hy) {
    var ret=[],ent_cnt=loc_hy.querySelectorAll(".ent_cnt"),add;
    ent_cnt.forEach(function(elem) {
	var url=elem.querySelector("a");
        var addphone=elem.querySelectorAll(".trgr .b_factrow");
	ret.push({name:url?url.innerText:"",
		  address:addphone.length>0?addphone[0].innerText.trim():"",phone:addphone.length>1?addphone[1].innerText.trim():"",
                  url:url?url.href:""});  });
    return ret;
};

/* parse queries to bing of the form https://www.bing.com/maps/overlaybfpr?q="+encodeURIComponent(my_query.address);
 * to grab business data location at an address,
 * TODO: Modify to make generic
 */
MTurkScript.prototype.parse_bing_overlay=function(doc,url,resolve,reject) {
    console.log("In parse_bing_overlay, url="+url);
    var moduleContainer=doc.querySelector(".EntityCollectionModuleContainer");
    var promise_list=[];
    if(!moduleContainer) {
        console.log("module container failed");
        reject("");
        return;
    }
    var ent_list,y;
    try {
        ent_list=JSON.parse(moduleContainer.dataset.entitylist);
        for(y of ent_list) {
            console.log("beginning promise list query of "+y.title);
            promise_list.push(make_addressplus_query(y.title,my_query.address));
        }
        Promise.all(promise_list).then(function() { resolve(""); })
            .catch(function(response) {
                console.log("Failure in addressplus queries "+response);
                resolve(""); });


    }
    catch(error) {
        console.log("Error "+error+", parsing entitylist JSON");
        reject("");
        return;
    }
};


/* fields_to_add should be my_query.fields 
   field_map if given should be map of fields_to_add to actual field names
*/
MTurkScript.prototype.add_to_sheet=function(fields_to_add,field_map) {
    var x,field;
    field_map=field_map||{};
    for(x in fields_to_add) {
	curr_mapped=field_map[x]!==undefined ? field_map[x]:x;
            if((this.is_crowd && (field=document.getElementsByName(curr_mapped)[0])) ||
               (!this.is_crowd && (field=document.getElementById(curr_mapped)))) field.value=fields_to_add[x];
        }
};

/* Creates a promise where it does a standard GM_xmlhttpRequest GET thing, on which point it
   does the DOMParser thing, loads the parser taking (doc,url,resolve,reject)

   and the promise does (mandatory) then_func on resolving, (optional, otherwise just prints a message) catch_func on
   rejecting
*/
MTurkScript.prototype.create_promise=function(url, parser, then_func, catch_func,extra_arg,headers) {
    if(catch_func===undefined) catch_func=MTurkScript.prototype.my_catch_func;
	if(headers===undefined) headers={};
    const queryPromise = new Promise((resolve, reject) => {
        GM_xmlhttpRequest(
            {method: 'GET', url: url,headers:headers,timeout:30000,
             onload: function(response) {
                 var doc = new DOMParser()
                     .parseFromString(response.responseText, "text/html");
                 if(extra_arg!==undefined) parser(doc,response.finalUrl, resolve, reject,extra_arg);
                 else parser(doc,response.finalUrl, resolve, reject,response);
             },
             onerror: function(response) { reject("Failed to load site "+url+", "+extra_arg); },
             ontimeout: function(response) { reject("Timed out loading site "+url+extra_arg); }
            });
    });
    queryPromise.then(then_func)
        .catch(function(response) { catch_func(response,url)});
    return queryPromise;
};

MTurkScript.prototype.my_then_func=function(response) {  };

MTurkScript.prototype.my_catch_func=function(response) { console.log("Request to url failed "+response); };
    /**
     * adjust_time adjusts the hr, min, ampm into military format */
MTurkScript.prototype.adjust_time=function(hr,min,ampm)
{
    var time12=parseInt(hr);
    if(ampm.toLowerCase()==="pm" && time12!==12) time12=time12+12;
    else if(ampm.toLowerCase()==="am" && time12==="12") time12=0;
    return ""+time12+":"+min;
};
    /**
     * parse_hr_match gives that a matched daily hours in FB's format is either CLOSED and if not closed,
     * sets the opening and closing times in military style format for submission
     */
MTurkScript.prototype.parse_hr_match=function(hr_match) {
    var result={closed:false,open:"",close:""};
    if((hr_match[2]===null||hr_match[2]===undefined) && (result.closed=true)) return result;
    result.open=MTurkScript.prototype.adjust_time(hr_match[2],hr_match[3],hr_match[4]);
    result.close=MTurkScript.prototype.adjust_time(hr_match[5],hr_match[6],hr_match[7]);
    return result;
};

    /* parse hours is a helper for parse_FB_about to parse opening hours */
MTurkScript.prototype.parse_hours=function(script)
{
    console.log("in MTurkScript.prototype.parse_hours");
    var result={};
    var text=script.innerHTML.replace(/^require\(\"TimeSlice\"\)\.guard\(\(function\(\)\{bigPipe\.onPageletArrive\(/,"")
	.replace(/\);\}\).*$/,"")
    text=text.replace(/([\{,]{1})([A-Za-z0-9_]+):/g,"$1\"$2\":").replace(/\\x3C/g,"<");
    var parsed_text=JSON.parse(text), instances=parsed_text.jsmods.instances;
   // console.log("parsed_text="+JSON.stringify(parsed_text));

    if(!instances || instances===undefined) { return result; }
    var x,i,j,good_instance,hr_match;
    var hr_regex=/^([A-Za-z]+):\s*(?:CLOSED|([\d]{1,2}):([\d]{2})\s*([A-Z]{2})\s*-\s*([\d]{1,2}):([\d]{2})\s*([A-Z]{2}))/i;
    for(i=0; i < instances.length; i++) {
        try {
            if(instances[i].length>=3 && instances[i][1].length>0 && instances[i][1][0]==="Menu"
               && instances[i][2].length>0 && (good_instance=instances[i][2][0])) {
                for(j=0; j < good_instance.length; j++) {
                    if(good_instance[j].label!==undefined && (hr_match=good_instance[j].label.match(hr_regex))) {
                        result[hr_match[1]]=MTurkScript.prototype.parse_hr_match(hr_match); }
                }
            }
        }
        catch(error) { console.log("error with hours "+error); }
    }
    return result;
};

MTurkScript.prototype.FB_match_coords = function(src) {
    var coords_regex=/markers=([-\d\.]+)%2C([-\d\.]+)/,coords_match,result={};
    if((coords_match=src.match(coords_regex))) result={lat:coords_match[1],lon:coords_match[2]};
    return result;
};

    /**
     * parse_FB_about is a create_promise style parser for a FB about page
     */
MTurkScript.prototype.parse_FB_about=function(doc,url,resolve,reject) {
    var result={},code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts,closed;
    if(doc.querySelector("#pageTitle")) result.pageTitle=doc.querySelector("#pageTitle").innerText.replace(/\s+-\s+About$/,"");
    for(i=0; i < scripts.length; i++) {
        if(/^bigPipe\.beforePageletArrive\(\"PagesProfileAboutInfoPagelet/.test(scripts[i].innerHTML) &&
	   i < scripts.length-1) result.hours=MTurkScript.prototype.parse_hours(scripts[i+1]);
    }
    
    for(i=0; i < code.length; i++) code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    if((closed=doc.querySelector("._14-5")) && /Permanently Closed/i.test(closed.innerText)) result.is_closed=true;
    var about_fields=doc.getElementsByClassName("_3-8j"),inner_field1,text;
    var _a3f=doc.getElementsByClassName("_a3f"),coord_ret,p_match; // map with coords
    if(_a3f.length>0 && (coord_ret=MTurkScript.prototype.FB_match_coords(_a3f[0].src))) {
        for(i in coord_ret) result[i]=coord_ret[i];
    }
    for(i=0; i < about_fields.length; i++) {
        //  console.log("about_fields["+i+"].className="+about_fields[i].className);
        inner_field1=about_fields[i].getElementsByClassName("_50f4");
	if((p_match=/^\s*Call (.*)$/.test(about_fields[i].innerText))) result.phone=p_match[1];
        if(about_fields[i].className.toString().indexOf("_5aj7")!==-1 &&
           about_fields[i].className.toString().indexOf("_20ud")!==-1 &&
           about_fields[i].getElementsByClassName("_4bl9").length>0) {
            //console.log("Found address");
            result.address="";
            let add_fields=about_fields[i].getElementsByClassName("_2iem");
            for(j=0; j < add_fields.length; j++) result.address=result.address+add_fields[j].innerText+",";
            result.address=result.address.replace(/,$/,"");
        }
        if(inner_field1.length===0) continue;
        text=inner_field1[0].innerText;
        if(email_re.test(text)) result.email=text;
        else if(inner_field1[0].parentNode.tagName==="DIV" &&
                !/_4bl9/.test(inner_field1[0].parentNode.className)) result.url=text;
        else if(/twitter\.com/i.test(text)) result.twitter_url=text;
        else if(/instagram\.com/i.test(text)) result.insta_url=text;
        else if(/pinterest\.com/i.test(text)) result.pinterest_url=text;
        else if(phone_re.test(text)) result.phone=text.match(phone_re)[0];
	else if((p_match=/Call (.*)$/.test(text))) result.phone=p_match[1];
        else if(/^About$/i.test(text) && about_fields[i].getElementsByClassName("_3-8w").length>0) {
            result.about=about_fields[i].getElementsByClassName("_3-8w")[0].innerText; }
	else if(/^\s*(Born|Founded) (on|in)\s*/.test(text)) {
	    result.founded=text.replace(/^\s*Founded (on|in)\s*/,""); }
	else if(/^Founding/i.test(text) && about_fields[i].getElementsByClassName("_3-8w").length>0 &&
	       !result.founded) {
            result.founded=about_fields[i].getElementsByClassName("_3-8w")[0].innerText; }
    }
    result.team=[];
    var t_m=doc.querySelectorAll("._42ef ._2iem");
    for(i=0; i < t_m.length;i++) result.team.push(t_m[i].innerText);
    resolve(result);
};
/* parse_search_script parses the script to get the search results; a helper function 
   for parse_FB_search
*/
MTurkScript.prototype.parse_search_script=function(script) {
    var result={success:true,sites:[]},parsed_text="",i,j;
    var text=script.innerHTML.replace(/^require\(\"TimeSlice\"\)\.guard\(\(function\(\)\{bigPipe\.onPageletArrive\(/,"")
        .replace(/\);\}\).*$/,"").replace(/src:\"([^\"]+)\"/g,"src:\"\"")
	.replace(/([\{,]{1})([A-Za-z0-9_]+):/g,"$1\"$2\":").replace(/\\x3C/g,"<").replace(/%23/g,"#");
    try { parsed_text=JSON.parse(text); }
    catch(error) { console.log("Error "+error+" when parsing\n"+text); }
    var require=parsed_text.jsmods.require;
    for(i=0; i < require.length; i++)
    {
        if(require[i].length>3 && require[i][0]==="ReactRenderer")
        {
            let results_list=require[i][3][0].props.results;
            for(j=0; j < results_list.length; j++) result.sites.push({url:results_list[j].uri,name:results_list[j].text});
        }
    }
    return result;
};
/* Parse FB_search parses a search on Facebook */
MTurkScript.prototype.parse_FB_search=function(doc,url,resolve,reject)
{
    console.log("fb_search url="+url);
    //console.log("this="+JSON.stringify(this));
    var result={success:false};
    var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts;
    for(i=0; i < scripts.length; i++) {
        if(/^bigPipe\.beforePageletArrive\(\"pagelet_loader_initial_browse_result/.test(scripts[i].innerHTML) && i < scripts.length-1)
        {
            /* Parse the next one */
	    console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
            result=MTurkScript.prototype.parse_search_script(scripts[i+1]);
            break;
        }
    }
    resolve(result);
    //console.timeEnd("fb_about");
};

/**
 * FB:match_home_text Returns list of two fields, either both blank or the first label, second value
 * helper for parse_FB_home
 */
MTurkScript.prototype.match_home_text=function(text) {

    var ret=["",""];
    var follow_re=/^([\d\,]+) people follow this/,like_re=/^([\d\,]+) people like this/;
    if(phone_re.test(text)) ret=["phone",text.match(phone_re)[0]];
    else if(email_re.test(text)) ret=["email",text.match(email_re)[0]];
    else if(follow_re.test(text)) ret=["followers",text.match(follow_re)[1].replace(/,/g,"")];
    else if(like_re.test(text)) ret=["likes",text.match(like_re)[1].replace(/,/g,"")];
    return ret;
};

/**
 * match_home_a FB: Returns list of two fields, either both blank or the first label, second value
 * helper for parse_FB_home
 */
MTurkScript.prototype.match_home_a=function(inner_a,text) {
    var ret=["",""],i, url_regex=/\.php\?u=(.*)$/;
    if(url_regex.test(inner_a[0].href) &&
       !/Get Directions/.test(inner_a[0].innerText)) {
        ret=["url",decodeURIComponent(inner_a[0].href.match(url_regex)[1])
             .replace(/\?fbclid.*$/,"")];
    }
    else if(/keywords_pages/.test(inner_a[0].href))
    {
        ret=["keywords",[]];
        for(i=0; i < inner_a.length; i++) ret[1].push(inner_a[i].innerText);
    }
    return ret;
};

/** 
 * MTurkScript.prototype.parseAddress is a quick'n'dirty attempt to fix up some of the 
 * edge cases with the 
 * parseAddress.parseLocation function from 
 * https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
 * 
 * will give 123 Fake Street in some instances so use with caution. SUPERSEDED BY address.js?
 */
MTurkScript.prototype.pre_parse_address=function(address)
{
    return address.replace(/\n/g,",").replace(/;/g,",").replace(/\s*\([^\)]+\)\s*/g,"")
	.replace(/(fl|floor)\s*([\d]+)/i,"").replace(/\s*\d[A-Za-z]{1,2}\s*floor\s*/i," ")
	.replace(/(Ste(\.?)|Suite) [\d]+/,"").replace(/Unit [A-Za-z\-\d]+,/,"")
	.replace(/P(\.|\s)?O(\.|\s)?\s*Box\s+[\d\-]+(,?)/i,"123 Fake Street,").replace(/,[^,]*County,/i,",")
	.replace(/(?:Room|Rm(?:\.)?)\s+(?:[\dA-Z\-]+)\s*(,)?/,"")
	.trim();
};

/** MTurkScript.prototype.parse_FB_home is a create_promise style function to 
 * scrape FB home page 
 */
MTurkScript.prototype.parse_FB_home=function(doc,url,resolve,reject)
{
    var result={success:true,fb_url:url},outer_part,_4bl9,i,j,inner_a,response,_4j7v;
    var _a3f,coord_ret,address,name,img;
    var code=doc.body.getElementsByTagName("code"),scripts=doc.scripts;
    for(i=0; i < code.length; i++) code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    if((outer_part=doc.getElementsByClassName("_1xnd")).length===0) {
        result.success=false;
        resolve(result);
        return;
    }
    if((img=doc.querySelector("._6tb5"))) result.img_url=img.src;
    if((name=doc.getElementsByClassName("_64-f")).length>0) result.name=name[0].innerText;
    if((_a3f=doc.getElementsByClassName("_a3f")).length>0 &&
       (coord_ret=MTurkScript.prototype.FB_match_coords(_a3f[0].src))) {
        for(i in coord_ret) result[i]=coord_ret[i];
    }
    _4bl9=outer_part[0].getElementsByClassName("_4bl9");
    for(i=0; i < _4bl9.length; i++) {
        if(_4bl9[i].getElementsByClassName("_2wzd").length>0 &&
           (address=MTurkScript.prototype.pre_parse_address(_4bl9[i].innerText.replace(/Get Directions$/,"")))
           && address) {
	    result.address=parseAddress.parseLocation(address);
	    result.addressInner=address;
	}
        if((inner_a=_4bl9[i].getElementsByTagName("a")).length===0 &&
	   (response=MTurkScript.prototype.match_home_text(_4bl9[i].innerText))
           && response[0].length>0) result[response[0]]=response[1];
        else if(inner_a.length>0 && (response=MTurkScript.prototype.match_home_a(inner_a))
                && response[0].length>0) result[response[0]]=response[1];
    }
    resolve(result);
};

MTurkScript.prototype.find_FB_about_url=function(url) {
        if(/\/pages\//.test(url)) {
            url=url.replace(/\/pages\/([^\/]*)\/([^\/]*).*$/,"/$1-$2");
        }
         url=url.replace(/(^https?:\/\/[^\/]*facebook\.com)\/([^\/]*).*$/,"https://www.facebook.com/pg/$2/about");
        return url;
    };

/* Parse FB_search parses a search for PAGES on Facebook */
MTurkScript.prototype.parse_FB_search_page=function(doc,url,resolve,reject)
{
    var result={success:false,sites:[]},code=doc.body.getElementsByTagName("code"),i,j,name,desc;
    try {
        for(i=0; i < code.length; i++) code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        name=doc.getElementsByClassName("_32mo")
        desc=doc.getElementsByClassName("_glo");
        for(i=0; i < name.length; i++) result.sites.push({name:name[i].innerText,url:name[i].href,text:desc[i].innerText});
        result.success=true;
    }
    catch(error) { console.log("Error in parse_FB_search_page "+error); result.success=false; }
    resolve(result);
};

MTurkScript.prototype.parse_FB_posts=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,j,code=doc.body.getElementsByTagName("code");
    var result={success:false},time;
    for(i=0; i < code.length; i++) code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    var posts=doc.getElementsByClassName("mbm");
    for(i=0; i < posts.length; i++) if(posts[i].getElementsByClassName("_449j").length===0) break;
    if(i>=posts.length || !(time=posts[i].getElementsByClassName("_5ptz")) ||
       time.length===0 || !time[0].title || time[0].title.split(" ").length<2 && (resolve(result)||1)) return;
    result={success:true,date:time[0].title.split(" ")[0],time:time[0].title.split(" ")[1]};
    resolve(result);
};

/* Generic to check if an FB link is generally bad, e.g. not the actual "page" for something 
TODO: have it repair it automatically
*/
MTurkScript.prototype.is_bad_fb=function(b_url,b_name) {
    if(/\/(pages|groups|search|events|directory|public)\//.test(b_url)) return true;
    if(/\/sharer\.php/.test(b_url)) return true;
    return false;
};

MTurkScript.prototype.is_bad_instagram=function(b_url,bname) {
    if(/instagram\.com\/(p|explore)\//.test(b_url)) return true;
    return false;
};

MTurkScript.prototype.is_bad_twitter=function(b_url,bname) {
    if(/twitter\.com\/(((intent|#\!)\/)|share\?)/.test(b_url)) return true;
    return false;
};


/* fix_remote_url fixes the remote urls so they aren't having the mturkcontent.com stuff
     * found_url is the url that needs fixing
     *  page_url is the url from response.finalUrl
   * TODO: once in a while it f's up?
    */
MTurkScript.prototype.fix_remote_url=function(found_url,page_url) {
    var replacement=page_url.match(/^https?:\/\/[^\/]+/);
    var to_replace= window.location.href.match(/^https?:\/\/[^\/]+/)[0];
    var curr_url=window.location.href, temp_url=curr_url.replace(/\/$/,"");
    while(temp_url.split("/").length>=3) {
        found_url=found_url.replace(temp_url,replacement);
        temp_url=temp_url.replace(/\/[^\/]+$/,"");
    }
    return found_url.replace(to_replace,replacement);
};

/* time24totime12 converts a 24hr form timestring into a 12hr form, 
   uppercase specifies if AM/PM are uppercase or lowercase, true by default */
MTurkScript.prototype.time24totime12=function(time_str,uppercase) {
    if(uppercase===undefined) uppercase=true;
    var time_match,ret="",ampm="am",hrtime;
    if(!(time_match=time_str.match(/([\d]+):([\d]+)/))) return time_str;
    if((hrtime=parseInt(time_match[1]))>12) ret=ret+(hrtime-12);
    else if(hrtime===0) ret=ret+(hrtime+12);
    else ret=ret+(hrtime);
    ret=ret+":"+time_match[2];
    if(hrtime>=12 && hrtime<24) ampm="pm";
    return ret+(uppercase ? ampm.toUpperCase() : ampm);
};


/* TODO: NOT READY */
MTurkScript.prototype.call_contact_page=function(url,callback,extension) {
    if(extension===undefined) { extension='';
                                MTurk.queryList.push(url); }
    GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
			   var doc = new DOMParser().parseFromString(response.responseText, "text/html");
			   contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
		       onerror: function(response) { console.log("Fail");
						     MTurk.doneQueries++;
						     callback(); },
		       ontimeout: function(response) { console.log("Fail timeout");
						       MTurk.doneQueries++;
						       callback(); }
		      });
};




/**
 * contact_response Here it searches for an email TODO:FIX */
MTurkScript.prototype.contact_response=function(doc,url,extra,email_list,phone_list) {
    console.log("in contact_response,url="+url);
    
    var i,j, my_match,temp_email,encoded_match,match_split;
    var extension=extra.extension,callback=extra.callback,nlp_temp;
    var title_result;
    if(extension===undefined) extension='';
    var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
    MTP.fix_emails(doc,url);
    for(x=0;x<style.length;x++) { style[x].innerHTML=""; }

    console.log("in contact_response "+url);
    var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
    var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
    var contact_regex=/(Contact|About|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
    console.log("replacement="+replacement);
    var temp_url,curr_url;
    doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
        .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".");
    MTP.fix_emails(doc,url);
    if((email_matches=doc.body.innerHTML.match(email_re))) {
        my_query.email_list=my_query.email_list.concat(email_matches);
        for(j=0; j < email_matches.length; j++) {
            if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
               (my_query.fields.email=email_matches[j])) break;
        }
        console.log("Found email hop="+my_query.fields.email);
    }

    if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
    for(i=0; i < links.length; i++)
    {
        if(/instagram\.com\/.+/.test(links[i].href) && !/instagram\.com\/[^\/]+\/.+/.test(links[i].href) && my_query.done["insta"]===undefined) {
            my_query.done["insta"]=false;
            console.log("***** FOUND INSTAGRAM "+links[i].href);
            var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
        if(/facebook\.com\/.+/.test(links[i].href) && !MTP.is_bad_fb(links[i].href) &&
           my_query.fb_url.length===0 && !my_query.found_fb) {
            my_query.found_fb=true;
            my_query.done.fb=false;
            my_query.fb_url=links[i].href;
            fb_promise_then(links[i].href);
        }
        //console.log("i="+i+", text="+links[i].innerText);
        if(extension==='' &&
           (contact_regex.test(links[i].innerText)||/\/(contact|about)/i.test(links[i].href))
           && !bad_contact_regex.test(links[i].href) &&
           !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url))) {
            MTurk.queryList.push(links[i].href);
            console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
            call_contact_page(links[i].href,callback,"NOEXTENSION");
            continue;
        }
        //if(my_query.fields.email.length>0) continue;
        if((temp_email=links[i].href.replace(/^\s*mailto:\s*/,"").match(email_re)) &&
           !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push(temp_email.toString());
        if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
        //if(email_re.test(temp_email) && !my_query.email_list.includes(temp_email)) my_query.email_list.push(temp_email);

    }
    console.log("* doing doneQueries++ for "+url);
    MTurk.doneQueries++;
    if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
    console.log("Calling evaluate emails from contact_response");
    evaluate_emails(callback);
    return;
};
/* Converts json to unencoded form for POST */
MTurkScript.prototype.json_to_post=function(obj) {
    var str="",x;
    for(x in obj) str=str+(str.length>0?"&":"")+encodeURIComponent(x)+"="+encodeURIComponent(obj[x]);
    return str;
};

/* matches_names Checks whether two names of places match, will need to be adjusted for use with b_name, e.g. split and iterate  */
MTurkScript.prototype.matches_names=function(name1,name2,debug) {
    var num_replace={"$10$2":/(^|[^A-Za-z])Zero($|[^A-Za-z])/i,"$11$2":/(^|[^A-Za-z])One($|[^A-Za-z])/i,"$12$2":/(^|[^A-Za-z])Two($|[^A-Za-z])/i,
                     "$13$2":/(^|[^A-Za-z])Three($|[^A-Za-z])/i,"$14$2":/(^|[^A-Za-z])Four($|[^A-Za-z])/i,"$15$2":/(^|[^A-Za-z])Five($|[^A-Za-z])/i,
		     "$16$2":/(^|[^A-Za-z])Six($|[^A-Za-z])/i,"$17$2":/(^|[^A-Za-z])Seven($|[^A-Za-z])/i,"$18$2":/(^|[^A-Za-z])Eight($|[^A-Za-z])/i,
		     "$19$2":/(^|[^A-Za-z])Nine($|[^A-Za-z])/i };
    var and_regex=/\s+(&|and)\s+.*$/,extra_regex=/[\.\']+/g,prefix_reg=/^The\s*/i,i,at_reg=/\s+(@|at)\s+.*$/;
    var split_camel=/([a-z]{1})([A-Z]{1})/,chain_reg=/^(Walmart).*$/,street_reg=/([^a-zA-Z]{1}|^)Street\s+/i;
    var final_my,final_other,x;
    var my_name=name1.replace(extra_regex,"").replace(chain_reg,"")
        .replace(prefix_reg,"").replace(split_camel,"$1 $2").replace(/-/g," ").replace(street_reg,"$1St ");
    for(x in num_replace) my_name=my_name.replace(num_replace[x],x);
    final_my=my_name.replace(and_regex,"").replace(at_reg,"").replace(/\s/g,"").toLowerCase().trim();
    if(debug) console.log("name1="+name1+"\nmy_name="+my_name+"\nfinal_my"+final_my);

    var other_name=name2.replace(extra_regex,"").replace(chain_reg,"").replace(prefix_reg,"").replace(split_camel,"$1 $2")
        .replace(/-/g," ").replace(street_reg,"St ");
    for(x in num_replace) other_name=other_name.replace(num_replace[x],x);
    final_other=other_name.replace(and_regex,"").replace(at_reg,"").replace(/\s/g,"").toLowerCase().trim();
    if(debug) console.log("name2="+name2+"\nother_name="+other_name+"\nfinal_other"+final_other);
    var common=MTurkScript.prototype.longest_common_subsequence(name1,name2);
    if(debug) console.log("Lengths: name1 ("+name1.length+"), name2 ("+name2.length+"), common ("+common.length+")");
    //console.log("my_name="+my_name+", other_name="+other_name);
    if(final_my===final_other || final_my.indexOf(final_other)!==-1 || final_other.indexOf(final_my)!==-1) {
	if(debug) console.log("True on first compare"); return true; }
    if(debug) console.log("False on first compare");

    for(i=0;i<final_my.length;i++) if(final_my.charAt(i)!==final_other.charAt(i)) break;
    if(i*3/2>=final_my.length) {
	if(debug) console.log("True on second compare");
	return true;
    }
    else if(debug)  console.log("False on second compare");
    var my_split=my_name.split(" ");
    var other_split=other_name.split(" ");
    if(my_split[0].toLowerCase()===other_split[0].toLowerCase() &&
       my_split[my_split.length-1].toLowerCase()===other_split[other_split.length-1].toLowerCase()) {
	if(debug) console.log("True on third compare");
	return true;
    }
    if(debug) console.log("False on third compare");

    
    return false;
};


/* Converts csv to an array */
MTurkScript.prototype.csvToArray=function(text) {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = '']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
};
/* Fixes the var addy type hidden emails in a document */
MTurkScript.prototype.fix_addy_script=function(link,script) {
    console.log("In fix_addy_script, script="+script.innerHTML);
    var addy=script.innerHTML.match(/var (addy[\d]+\s*\=)/),split=script.innerHTML.split("\n");
    var str_list=[""],i,addy_reg,match,email,str_reg=/\'[^\']*\'/g;
    const reducer = (acc, curr) => acc + curr.replace(/\'/g,"");
    const replacer = (match,p1) => String.fromCharCode(parseInt(p1));
    if(!addy) return;
    addy_reg=new RegExp(addy[1]);
    for(i=0;i<split.length;i++) if(addy_reg.test(split[i]) && (match=split[i].match(str_reg))) str_list=str_list.concat(match);
    email=str_list.reduce(reducer);
    while(/&#([\d]+);/.test(email)) email=email.replace(/&#([\d]+);/,replacer);
    //console.log("email="+email);
    if(email.match(email_re)) link.href="mailto:"+email;
};
MTurkScript.prototype.fix_addy_script_only=function(script) {
        console.log("In fix_addy_script, script="+script.innerHTML);
        var addy=script.innerHTML.match(/var (addy[\da-z]+\s*\=)/),split=script.innerHTML.split("\n");
        var str_list=[""],i,addy_reg,match,email,str_reg=/\'[^\']*\'/g;
        const reducer = (acc, curr) => acc + curr.replace(/\'/g,"");
        const replacer = (match,p1) => String.fromCharCode(parseInt(p1));
        if(!addy) return;
        addy_reg=new RegExp(addy[1]);
        for(i=0;i<split.length;i++) if(addy_reg.test(split[i]) && (match=split[i].match(str_reg))) str_list=str_list.concat(match);
        email=str_list.reduce(reducer);
        while(/&#([\d]+);/.test(email)) email=email.replace(/&#([\d]+);/,replacer);
        console.log("email="+email);
        if(email.match(email_re)) {
            if(script.parentNode) script.parentNode.innerHTML=email;
	    else script.innerHTML=email;
//            console.log("script.parentNode="+script.parentNode);
        }
};

MTurkScript.prototype.fix_addy_cloak_only=function(script) {
	 console.log("In fix_addy_cloak, script="+script.innerHTML);
        var addy=script.innerHTML.match(/var addy_text[a-z0-9]*\s*\=\s*([^;]*);/);//b84182bd78905ee0b1f7937c76319bd2 = 'info' + '@' + 'werkzeugkiste-ol' + '.' + 'de'/),split=script.innerHTML.split("\n");
        if(!addy) return;
        console.log("addy=",addy);
        let email=addy[1].replace(/[\'\+\s]/g,"");
        console.log("fixed_email=",fixed_email);
        if(email.match(email_re)) {
            if(script.parentNode) script.parentNode.innerHTML=email;
            else script.innerHTML=email;
            //            console.log("script.parentNode="+script.parentNode);
        }
};


MTurkScript.prototype.fix_escramble=function(doc,script) {
    var regex1=/b(?:\+)?=\'([^\']*)\'/g,match,regex2=/\'([^\']*)\'/,i;
    var ret="",match2;
    if((match=script.innerHTML.match(regex1))) {
        for(i=0;i<match.length;i++) {
            if((match2=match[i].match(regex2))) ret=ret+match2[1].trim();
        }
    }
    var a=doc.createElement("a");
    a.href="mailto:"+ret;
    a.innerHTML=ret;
    script.parentNode.insertBefore(a,script);

};

MTurkScript.prototype.fix_timwilliams=function(doc,script) {
    var coded_re=/coded\s*\=\s*\"([^\"]*)\"/,key_re=/key\s*\=\s*\"([^\"]*)\"/,m_code,m_key;
    var coded,key,shift,link="",i,ltr;
    var docwrite_re=/\'([^\']+)\'\s*\+\s*\'\<\/a\>\'\);/,matchname;
    
    if((m_code=script.innerHTML.match(coded_re))&&(m_key=script.innerHTML.match(key_re))&&
       (coded=m_code[1])&&(key=m_key[1])&&(matchname=script.innerHTML.match(docwrite_re))) {	
	shift=coded.length;
	for (i=0; i<coded.length; i++) {
	    if (key.indexOf(coded.charAt(i))==-1) link += (coded.charAt(i));
	    else {     
		ltr = (key.indexOf(coded.charAt(i))-shift+key.length) % key.length;
		link += (key.charAt(ltr));
	    }
	}
	console.log("Found, key="+key+", coded="+coded+", link="+link.toLowerCase()+", matchname="+matchname);
	var a=doc.createElement("a");
	a.href="mailto:"+link.toLowerCase();
	a.innerHTML=matchname[1];
	script.parentNode.insertBefore(a,script);
    }
};


   /* TODO: add these three to MTurkScript */
MTurkScript.prototype.reverse_str=function(str) {
        var ret="",i;
        for(i=str.length-1;i>=0;i--) ret+=str.charAt(i);
        return ret;
};

MTurkScript.prototype.fix_insertEmail=function(script,match) {
    console.log("in fix_insertEmail, match="+match);
    var parent=script.parentNode;
    var email=MTurkScript.prototype.reverse_str(match[2])+"@"+MTurkScript.prototype.reverse_str(match[1]);
    parent.innerHTML=email;
};

/* inserts an href with mailto:email, and innerHTML text before elem; 
 * if elem has no parent node, does nothing, note that text defaults to the email */
MTurkScript.prototype.insert_email_before=function(doc,elem,email,text) {
    if(text===undefined) text=email;
    let a=doc.createElement("a");
    a.href="mailto:"+email;
    a.innerHTML=text;
    if(elem.parentNode && doc.body.contains(elem)) elem.parentNode.insertBefore(a,elem);
    else doc.body.appendChild(a);
};

/** Fixes the emails obfuscated in scripts */
MTurkScript.prototype.fix_emails_in_scripts=function(doc,url,the_script) {
    var unesc_regex=/(?:unescape|decodeURIComponent)\((?:[\"\']{1})([^\"\"]+)(?:[\"\']{1})/;
    var match=the_script.innerHTML.match(unesc_regex),decoded,match2;
    var w_match,x_match,fix_count=0;
    var insertEmailRegex=/insertEmail\([\'\"]{1}([^\'\"]+)[\'\"]{1},\s*[\'\"]{1}([^\'\"]+)[\'\"]{1}\)/;

    w_match=the_script.innerHTML.match(/var\s*w\s*\=\s*\'([^\']+)\'/);
    x_match=the_script.innerHTML.match(/var\s*x\s*\=\s*\'([^\']+)\'/);
    if(/var addy[\d]+/.test(the_script.innerHTML)) MTurkScript.prototype.fix_addy_script_only(the_script);
	if(/var addy_text/.test(the_script.innerHTML)) MTurkScript.prototype.fix_addy_cloak_only(the_script);
    else if(/function escramble/.test(the_script.innerHTML)) MTurkScript.prototype.fix_escramble(doc,the_script);
    else if(the_script.innerHTML.indexOf("// Email obfuscator script 2.1 by Tim Williams")!==-1) MTurkScript.prototype.fix_timwilliams(doc,the_script);
    else if(match&&(decoded=decodeURIComponent(match[1]))&&(match2=decoded.match(email_re))) {
        console.log("Matched weird decode");
	MTurkScript.prototype.insert_email_before(doc,the_script,match2[0],match2[0]);
    }
    else if((match=the_script.innerHTML.match(insertEmailRegex))) MTurkScript.prototype.fix_insertEmail(scripts[i],match);
    //if((match=/FS\.util\.insertEmail\(\"[^\"]*\",\s*\"([^\"]*)\",\s*\"([^\"]*)\"/)) {
    else if(w_match && x_match) {
	console.log("Found w_match="+w_match+", x_match="+x_match);
	MTurkScript.prototype.insert_email_before(doc,the_script,w_match[1]+"@"+x_match[1],w_match[1]+"@"+x_match[1]);
//	let a=doc.createElement("a");
//	a.href="mailto:"+w_match[1]+"@"+x_match[1];
//	a.innerHTML=w_match[1]+"@"+x_match[1];
//	the_script.parentNode.insertBefore(a,the_script);
    }
    else if(the_script.innerHTML.length<100000&&
            (match=the_script.innerHTML.match(/[\'\"]{1}([\<\>^\'\"\n\s\t;\)\(]+@[^\>\<\'\"\s\n\t;\)\(]+\.[^\<\>\'\"\s\n\t;\)\(]+)[\'\"]{1}/))) {
        if((match2=match[1].match(email_re)) && !MTP.is_bad_email(match2[0])) {
            console.log("Found email in scripts "+the_script.innerHTML);
            MTurkScript.prototype.insert_email_before(doc,the_script,match2[0],match2[0]);
        }
               // console.timeEnd("search");
    }
    if(the_script) the_script.innerHTML="";
};




/* Fixes the hidden emails in a document
 */
MTurkScript.prototype.fix_emails=function(doc,url) {
    var i,links=doc.links,j,script,scripts=doc.scripts;
    var my_match,temp_email,encoded_match,match_split,clicky,local,domain;
	
	doc.querySelectorAll(".emailli").forEach(function(elem) {
		let a;
		if(elem.dataset.l && elem.dataset.r && (a=elem.querySelector("a"))) {
			a.href="mailto:"+elem.dataset.l+"@"+elem.dataset.r.replace(/%/g,".");
			a.innerHTML=elem.dataset.l+"@"+elem.dataset.r.replace(/%/g,".");
		}
		
	});
	
    for(i=0; i < links.length; i++) {
        //console.log("("+i+"): "+links[i].href+", "+links[i].innerText);
	if((local=links[i].querySelector(".localMail")) && (domain=links[i].querySelector(".domainMail"))) {
	    links[i].href=links[i].innerText="mailto:"+local.innerText.trim()+"@"+domain.innerText.trim();
	}
        if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
           && !MTurkScript.prototype.is_bad_email(temp_email)) links[i].href="mailto:"+temp_email;
	else if(/mailto/.test(links[i].className) && (temp_email=MTP.swrot13(links[i].href)) &&
                !MTurkScript.prototype.is_bad_email(temp_email.toString())) links[i].href="mailto:"+temp_email;
        else if(links[i].href.indexOf("cdn-cgi/l/email-protection")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
		(temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
		!MTurkScript.prototype.is_bad_email(temp_email)) links[i].href="mailto:"+temp_email;
	
	else if(links[i].dataset.cfemail!==undefined && (temp_email=MTurkScript.prototype.cfDecodeEmail(links[i].dataset.cfemail).replace(/\?.*$/,"")) &&
		!MTurkScript.prototype.is_bad_email(temp_email)) links[i].href="mailto:"+temp_email;
	if(links[i].dataset.cfemail!==undefined) { console.log("cfemail="+links[i].dataset.cfemail+",decode="+MTurkScript.prototype.cfDecodeEmail(links[i].dataset.cfemail.toString())); }
	else if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") && 
		(encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
            for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
            if(!MTurkScript.prototype.is_bad_email(temp_email)) links[i].href="mailto:"+temp_email;
        }
	else if(links[i].href.indexOf("javascript:linkTo_UnCryptMailto(")!==-1 &&
		(encoded_match=links[i].href.match(/linkTo_UnCryptMailTo\(\'([^\)]*)\'\)/)) &&
		(temp_email=MTurkScript.linkTo_UnCryptMailto(encoded_match[1].trim()))) links[i].href="mailto:"+temp_email;
        else if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
		(encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/)) &&
		(temp_email=MTurkScript.prototype.DeCryptX(encoded_match[1].trim()))) links[i].href="mailto:"+temp_email;
        else if((script=links[i].querySelector("script")) &&
		/var addy[\d]+/.test(script.innerHTML)) MTurkScript.prototype.fix_addy_script(links[i],script);
	else if((clicky=links[i].getAttribute("onclick"))&&
		(encoded_match=clicky.match(/mailme\([\'\"]{1}([^\'\"]+)[\'\"]{1}/i))
                && (temp_email=decodeURIComponent(encoded_match[1]).replace("[nospam]","@"))) links[i].href="mailto:"+temp_email;
	else if(links[i].dataset&&links[i].dataset.domain!==undefined &&
		links[i].dataset.user!==undefined) {
	    links[i].href="mailto:"+links[i].dataset.user+"@"+links[i].dataset.domain;  }
        // console.log("("+i+"): "+links[i].href+", "+links[i].innerText);
    }
    for(x=0;x<scripts.length;x++) MTurkScript.prototype.fix_emails_in_scripts(doc,url,scripts[x]);
};

// decrypt helper function
MTurkScript.prototype.decryptCharcode=function(n,start,end,offset) {
    n = n + offset;
    if (offset > 0 && n > end) n = start + (n - end - 1);
    else if (offset < 0 && n < start) n = end - (start - n - 1);
    return String.fromCharCode(n);
};
// decrypt string
MTurkScript.prototype.UnCrypt_decryptString=function(enc,offset) {
    var dec = "",len = enc.length;
    for(var i=0; i < len; i++) {
	var n = enc.charCodeAt(i);
	if (n >= 0x2B && n <= 0x3A) {
	    dec += MTurkScript.prototype.UnCrypt_decryptCharcode(n,0x2B,0x3A,offset);	// 0-9 . , - + / :
	} else if (n >= 0x40 && n <= 0x5A) {
	    dec += MTurkScript.prototype.UnCrypt_decryptCharcode(n,0x40,0x5A,offset);	// A-Z @
	} else if (n >= 0x61 && n <= 0x7A) {
	    dec += MTurkScript.prototype.UnCrypt_decryptCharcode(n,0x61,0x7A,offset);	// a-z
	} else dec += enc.charAt(i);
    }
    return dec;
};
// decrypt spam-protected emails
MTurkScript.prototype.linkTo_UnCryptMailto=function(s) {
    location.href = MTurkScript.prototype.UnCrypt_decryptString(s,-1);
};

MTurkScript.prototype.is_bad_page=function(doc,url) {
    var links=doc.links,i,scripts=doc.scripts;
    var title=doc.title;
    var iframes=doc.querySelectorAll("iframe"),a;
    var headers=doc.querySelectorAll("h1,h2");
    for(i=0;i<headers.length;i++) {
	if(/^Website Coming Soon$/i.test(headers[i].innerText)) return true; }
    for(i=0;i<iframes.length;i++) {
        if(iframes[i].src&&/parked\-content\.godaddy\.com/.test(iframes[i].src)) return true;
    }
    if(/cgi-sys\/(suspendedpage\.cgi|defaultwebpage\.cgi)$/.test(url.replace(/\$/,""))) return true;
    if(/hugedomains\.com|qfind\.net|\?reqp\=1&reqr\=/.test(url)) { return true; }
    else if(/(Expired)|(^404)|(Error)|(is for sale)|(^502 )/.test(title)) return true;
    else if(doc.querySelector("div.leftblk h3.domain_name")) return true;
    if(/^(IIS7|404)/.test(title.trim())) return true;
    if((doc.title===MTP.get_domain_only(url,true)||(doc.title===MTP.get_domain_only(url,false)))
       && doc.body.innerHTML.length<500) return true;
    if((a=doc.querySelector(".ams"))&&(a.innerText==="Click here to buy this domain")) return true;
    if(/^Not found$/i.test(doc.body.innerText)) return true;
    return false;
};

MTurkScript.prototype.parse_vcard=function(doc,url,resolve,reject,response) {
    function replace_addr_semicolon(match,offset,string) {
        return offset+match.length<string.length ? ",":"";
    }
    var lines=response.responseText.split(/[\n]+/),i,j,k,match;
    var regexes=[{regex:/^N:\s*([^;]*);([^;]*)/,terms:["last","first"],replace_regex:null,replacer:null},
                 {regex:/^EMAIL[^:]*:\s*([^;]*)/,terms:["email"],replace_regex:null,replacer:null},
                 {regex:/^TEL[^:]*:\s*([^;]*)/,terms:["phone"],replace_regex:null,replacer:null},
                 {regex:/^ADR[^:]*:\s*(.*)/,terms:["address"],replace_regex:/;+/g,replacer:replace_addr_semicolon}];
    var result={first:"",last:"",email:"",phone:"",address:""};
    for(i=0;i<lines.length;i++) {
        for(j=0;j<regexes.length;j++) {
            if((match=lines[i].match(regexes[j].regex))) {
                if(regexes[i].terms.length===1&& regexes[j].replace_regex &&
                   regexes[j].replacer) match[1]=match[1].replace(regexes[j].replace_regex,regexes[j].replacer);
                for(k=0;k<regexes[j].terms.length;k++) result[regexes[j].terms[k]]=match[k+1];
            }
        }
    }
    resolve(result);
};

/* Finds longest common subsequence of two strings */
MTurkScript.prototype.longest_common_subsequence=function(set1, set2) {
    // Init LCS matrix.
    const lcsMatrix = Array(set2.length + 1).fill(null).map(() => Array(set1.length + 1).fill(null));
    var columnIndex,rowIndex;
    // Fill first row with zeros.
    for (columnIndex = 0; columnIndex <= set1.length; columnIndex += 1) lcsMatrix[0][columnIndex] = 0;;
    // Fill first column with zeros.
    for (rowIndex = 0; rowIndex <= set2.length; rowIndex += 1) lcsMatrix[rowIndex][0] = 0;
    // Fill rest of the column that correspond to each of two strings.
    for (rowIndex = 1; rowIndex <= set2.length; rowIndex += 1) {
        for (columnIndex = 1; columnIndex <= set1.length; columnIndex += 1) {
            if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
                lcsMatrix[rowIndex][columnIndex] = lcsMatrix[rowIndex - 1][columnIndex - 1] + 1;
            } else {
                lcsMatrix[rowIndex][columnIndex] = Math.max(lcsMatrix[rowIndex - 1][columnIndex],
                    lcsMatrix[rowIndex][columnIndex - 1]);
            }
        }
    }
    // Calculate LCS based on LCS matrix.
    if (!lcsMatrix[set2.length][set1.length])  return [''];

    const longestSequence = [];
    columnIndex = set1.length;
    rowIndex = set2.length;
    while (columnIndex > 0 || rowIndex > 0) {
        if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
            // Move by diagonal left-top.
            longestSequence.unshift(set1[columnIndex - 1]);
            columnIndex -= 1;
            rowIndex -= 1;
        }
	else if (lcsMatrix[rowIndex][columnIndex] === lcsMatrix[rowIndex][columnIndex - 1]) columnIndex -= 1;
        else rowIndex -= 1;
    }
    return longestSequence;
};
/* TODO: FIX TO NOT DEPEND ON my_query */
MTurkScript.prototype.is_bad_name=function(orig_name,b_name,p_caption,i) {
    function is_bad_name_replacer(match,p1,p2,p3) {
	if(/Saint/i.test(p2)) return p1+"St"+p3;
        else return p1+"Mt"+p3;
    }

    
    var orig_b_name=b_name;
    var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
    var lower_b=MTurkScript.prototype.removeDiacritics(b_name.toLowerCase().replace(reg,""));
    var lower_my=MTurkScript.prototype.removeDiacritics(orig_name).replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
    if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
    b_name=b_name.replace(b_replace_reg,"").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                    is_bad_name_replacer);
    orig_name=orig_name.replace("’","\'").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                         is_bad_name_replacer);
    console.log("b_name="+b_name+", orig_name="+orig_name);
    if(MTP.matches_names(b_name,orig_name)) return false;
    var b_name2=orig_b_name.split(/\s+[\-\|–]{1}\s+/),j;
    console.log("b_name2="+JSON.stringify(b_name2));
    for(j=0;j<b_name2.length;j++) {
        orig_name=orig_name.replace("’","\'");
        console.log("b_name="+b_name2[j]+", orig_name="+orig_name);
        if(MTP.matches_names(b_name2[j],orig_name)) return false;
        if(b_name2[j].toLowerCase().indexOf(orig_name.split(" ")[0].toLowerCase())!==-1) return false;
    }

    if(i===0 && b_name.toLowerCase().indexOf(orig_name.split(" ")[0].toLowerCase())!==-1) return false;
    return true;
};
/* 
people should be parsed_context.people
full should be result of MTP.parse_name or equivalent */
MTurkScript.prototype.found_good_person=function(people,full,resolve,reject,type) {
    let curr_person;
    for(curr_person of people) {
        curr_person.name=curr_person.name.replace(/,.*$/,"").replace(/\s*\([^\)]*\)/g,"").trim();
        console.log("curr_person.name="+curr_person.name);
      
        console.log("@ full="+JSON.stringify(full)+", my_query.fullname="+JSON.stringify(my_query.fullname));
        if(full.lname.indexOf(my_query.fullname.lname)!==-1&&
           full.fname.charAt(0).toLowerCase()===my_query.fullname.fname.charAt(0).toLowerCase()) {
            console.log("url="+curr_person.url);
            var search_str=decodeURIComponent(curr_person.url.match(/\?q\=([^&]*)&/)[1]).replace(/\+/g," ");
            console.log("### Found good person ");
            my_query.found_good=true;
            var filters=curr_person.url.match(/&filters\=([^&]*)/)[1];
            query_search(search_str,resolve,reject,query_response,type,filters);
	    //                var promise=MTP.create_promise(curr_person.url,query_response,resolve,reject,type);
            return true;
        }
    }
    return false;
};

/* Do proper name casing, UNTESTED */
MTurkScript.prototype.proper_name_casing=function(name) {
    if(/^[A-Z][a-z]/.test(name)) return name;
    name=name.toLowerCase();
    if(/^mc/.test(name)&&name.length>=4) return "Mc"+name.substr(2,1).toUpperCase()+name.substr(3);
    if(name.length>1) return name.substr(0,1).toUpperCase()+name.substr(1);
    return name;
};


MTurkScript.prototype.fix_incomplete_url=function(url) {
    
    if(!/^http/.test(url) && !/^www\./.test(url)) url="http://www."+url;
    else if(!/^http/.test(url)) url="http://"+url;
    return url;
};

/* Checks incompletely whether a company is likely to accept credit cards */
MTurkScript.prototype.company_accepts_cards=function(doc,url) {
    var links=doc.links,x;
    for(x of links) {
        if(/\/(donate|cart)$/.test(x.href.replace(/\/$/,"")) ||
           /^(Donate|Cart)$/i.test(x.innerText)) return true;
    }
    return false;
};
/* Gets company name (or a list of potential names, rather) from copyright if one exists */
MTurkScript.prototype.company_from_copyright=function(doc,url) {
    var div_list=doc.querySelectorAll("div,p");
    var copyright_list=[];
    div_list.forEach(function(elem) {
            if(elem.querySelector("div,p")) return;
            MTurkScript.prototype.find_copyright_elem(elem,copyright_list); });
    return copyright_list;
};
/* Helper for company_from_copyright */
MTurkScript.prototype.find_copyright_elem=function(elem,lst) {
    var re=/^\s*(?:Copyright)?\s*(?:©)\s*(?:Copyright)?\s*(?:[\d\-]{4,})?(?:[\s\|\.·]*)([^\n\t\|\-\.·,]*)/,match;
    var re2=/^\s*©(?: Copyright)? \s*(?:[\d\-]*)\s*([^\n\t\|\-\.·,]*)/;
    var my_match;
    if((match=elem.innerText.match(re))||(match=elem.innerText.match(re2))) {
        my_match=match[1].trim().replace(/((19[\d]{2})|(20[\d]{2}))$/,"").trim();
        my_match=my_match.replace(/\s*All Rights Reserved$/,"").replace(/®/g,"");
        if(my_match.length>0) lst.push(my_match);
    }
};


var MTP=MTurkScript.prototype;


/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  Revision #3 - July 13th, 2017
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|  https://github.com/madmurphy/cookies.js
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path[, domain]])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
  getItem: function (sKey) {
    if (!sKey) { return null; }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          /*
          Note: Despite officially defined in RFC 6265, the use of `max-age` is not compatible with any
          version of Internet Explorer, Edge and some mobile browsers. Therefore passing a number to
          the end parameter might not work as expected. A possible solution might be to convert the the
          relative time to an absolute time. For instance, replacing the previous line with:
          */
          /*
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; expires=" + (new Date(vEnd * 1e3 + Date.now())).toUTCString();
          */
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};



