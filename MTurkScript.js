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

var reverse_state_map={},reverse_province_map={};
for(let x in state_map)     reverse_state_map[state_map[x]]=x;
for(let x in province_map)     reverse_province_map[province_map[x]]=x;

/* Regular expressions for emails, phones, faxes */
var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*x\s*[\d]{1,3})?/im;
var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;

var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];


var defaultDiacriticsRemovalMap = [
    {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
    {'base':'AA','letters':'\uA732'},
    {'base':'AE','letters':'\u00C6\u01FC\u01E2'},
    {'base':'AO','letters':'\uA734'},
    {'base':'AU','letters':'\uA736'},
    {'base':'AV','letters':'\uA738\uA73A'},
    {'base':'AY','letters':'\uA73C'},
    {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
    {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
    {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0'},
    {'base':'DZ','letters':'\u01F1\u01C4'},
    {'base':'Dz','letters':'\u01F2\u01C5'},
    {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
    {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
    {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
    {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
    {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
    {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
    {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
    {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
    {'base':'LJ','letters':'\u01C7'},
    {'base':'Lj','letters':'\u01C8'},
    {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
    {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
    {'base':'NJ','letters':'\u01CA'},
    {'base':'Nj','letters':'\u01CB'},
    {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
    {'base':'OI','letters':'\u01A2'},
    {'base':'OO','letters':'\uA74E'},
    {'base':'OU','letters':'\u0222'},
    {'base':'OE','letters':'\u008C\u0152'},
    {'base':'oe','letters':'\u009C\u0153'},
    {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
    {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
    {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
    {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
    {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
    {'base':'TZ','letters':'\uA728'},
    {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
    {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
    {'base':'VY','letters':'\uA760'},
    {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
    {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
    {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
    {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
    {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
    {'base':'aa','letters':'\uA733'},
    {'base':'ae','letters':'\u00E6\u01FD\u01E3'},
    {'base':'ao','letters':'\uA735'},
    {'base':'au','letters':'\uA737'},
    {'base':'av','letters':'\uA739\uA73B'},
    {'base':'ay','letters':'\uA73D'},
    {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
    {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
    {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
    {'base':'dz','letters':'\u01F3\u01C6'},
    {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
    {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
    {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
    {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
    {'base':'hv','letters':'\u0195'},
    {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
    {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
    {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
    {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
    {'base':'lj','letters':'\u01C9'},
    {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
    {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
    {'base':'nj','letters':'\u01CC'},
    {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
    {'base':'oi','letters':'\u01A3'},
    {'base':'ou','letters':'\u0223'},
    {'base':'oo','letters':'\uA74F'},
    {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
    {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
    {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
    {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
    {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
    {'base':'tz','letters':'\uA729'},
    {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
    {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
    {'base':'vy','letters':'\uA761'},
    {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
    {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
    {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
    {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
];

var diacriticsMap = {};
for (var i=0; i < defaultDiacriticsRemovalMap .length; i++){
    var letters = defaultDiacriticsRemovalMap [i].letters;
    for (var j=0; j < letters.length ; j++){
        diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap [i].base;
    }
}

//console.log("Munky");

/* return_ms is the number of milliseconds to wait before returning the HIT,
 * submit_ms is the number of milliseconds to wait before submitting the HIT
 * sites should be a list of {fragment:this.sites[x],timeout:2000} type objects
 sites we will be doing standardized scraping off of
 * callback is the init_Query type function to initialize the custom part of the script running
 * requester_id is the MTurk id of the requester so it doesn't accidentally run on wrong HITs
 */
function MTurkScript(return_ms,submit_ms,sites,callback,requester_id)
{
//    console.log("Initializing MTurkScript");
    this.return_ms=return_ms;
    this.submit_ms=submit_ms;
    this.sites=sites;
    this.site_parser_map={"bloomberg.com/research/stocks/private/snapshot.asp":this.parseext_bloomberg_snapshot,
                          "bloomberg.com/profiles/companies/":this.parseext_bloomberg_profile,
                          "instagram.com":this.parseext_instagram};
    this.query={};
    this.attempts={};
    this.requester_id=requester_id;
    
    for(x in this.site_parser_map) {
        this.attempts[x]=0;
        //console.log("this.site_parser_map["+x+"]="+this.site_parser_map[x]);
    }
   // console.log("this.sites="+JSON.stringify(this.sites));
    /* site_parser_map maps a website url fragment to a parser */

    this.globalCSS=GM_getResourceText("globalCSS");
 //   console.log("MTurk:Initializing mturk "+JSON.stringify(this.site_parser_map));

    // initialize external site parsers
    for(var x=0; x<this.sites.length; x++)
    {
        console.log("x="+x+"\t"+this.sites[x].fragment);
        /* Only needs to be right domain at least for now */
        if(this.site_parser_map[this.sites[x].fragment]!==undefined &&
           window.location.href.indexOf(this.sites[x].fragment.replace(/\/.*$/,""))!==-1)
        {
            console.log("Initializing with "+this.sites[x].fragment);
            GM_setValue(this.sites[x].fragment+"_url","");
            GM_addValueChangeListener(this.sites[x].fragment+"_url",function() {
                window.location.href=arguments[2]; });
            //    console.log("this.site_parser_map.has("+this.sites[x].fragment+")="+this.site_parser_map[this.sites[x].fragment]!==undefined);
            //  console.log("function="+this.site_parser_map[this.sites[x].fragment]);
            if(window.location.href.indexOf(this.sites[x].fragment)!==-1)
            {
                console.log("Calling parser for "+x);
                setTimeout(
                    this.site_parser_map[this.sites[x].fragment],this.sites[x].timeout,document,this,this.sites[x].fragment);
            }
        }
        else
        {
            console.log("this.site_parser_map.has("+this.sites[x].fragment+")="+(this.site_parser_map[this.sites[x].fragment]!==undefined));
        }
    }
    if ((window.location.href.indexOf("mturkcontent.com") !== -1 ||
         window.location.href.indexOf("amazonaws.com") !== -1) &&
        !document.getElementById("submitButton").disabled &&
	GM_getValue("req_id","")===this.requester_id) callback();
    if(window.location.href.indexOf("worker.mturk.com")!==-1) {
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
        var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
	var detail_a=document.getElementsByClassName("project-detail-bar")[0].children[0]
        .children[1].getElementsByClassName("detail-bar-value")[0].getElementsByTagName("a")[0];
        var req_id=detail_a.href.match(/requesters\/([^\/]+)/);
        if(req_id && req_id[1]===this.requester_id) GM_setValue("req_id",req_id[1]);
        else { console.log("Wrong requester: found "+req_id[1]+", desired "+this.requester_id);
	       return; }
      
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span"), btn_automate=document.createElement("button");
        var btns_primary=document.getElementsByClassName("btn-primary")
        var btns_secondary=document.getElementsByClassName("btn-secondary");
        console.log("loc="+window.location.href);
        var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
        GM_addStyle(this.globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating according to return_ms */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
            }, this.return_ms);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 &&
               btns_secondary[0].innerText==="Return")
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });

        if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
           btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {
            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }
    }
}



MTurkScript.prototype.check_and_submit=function(check_function)	{
    console.log("in check");
    if(check_function!==undefined && !check_function())
    {
        GM_setValue("returnHit",true);
        console.log("bad");
        return;
    }
    console.log("Checking and submitting");


    if(GM_getValue("automate"))
    {
        setTimeout(function() { document.getElementById("submitButton").click(); },
                   this.submit_ms);
    }
}
MTurkScript.prototype.removeDiacritics=function(str) {
    return str.replace(/[^\u0000-\u007E]/g, function(a){
        return diacriticsMap[a] || a;
    });
}
MTurkScript.prototype.DeCryptString = function(s)
{
    var n = 0,r = "mailto:",z = 0;
    for( var i = 0; i < s.length/2; i++)
    {
        z = s.substr(i*2, 1);
        n = s.charCodeAt( i*2+1 );
        if( n >= 8364 )
        {
            n = 128;
        }
        r += String.fromCharCode( n - z );
    }
    return r;
}
/* DecryptX decrypts certain types of email */
MTurkScript.prototype.DeCryptX=function(s)
{
    return this.DeCryptString( s );
}
/* cfDecodeEmail decodes Cloudflare encoded emails */
MTurkScript.prototype.cfDecodeEmail=function(encodedString) {
    var email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
    for (n = 2; encodedString.length - n; n += 2){
        i = parseInt(encodedString.substr(n, 2), 16) ^ r;
        email += String.fromCharCode(i);
    }
    return email;
}
/* Some basic checks for improper emails beyond email_re */
MTurkScript.prototype.is_bad_email = function(to_check)
{
    if(to_check.indexOf("@2x.png")!==-1 || to_check.indexOf("@2x.jpg")!==-1) return true;
    else if(to_check.indexOf("s3.amazonaws.com")!==-1) return true;
    else if(/@(domain\.com|example\.com)/.test(to_check)) return true;
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
    var i,dash_split,do_dashes;
    the_url=the_url.replace(/\/$/,"");
    if(max_depth===undefined) max_depth=4;
    if(max_dashes===undefined || max_dashes===-1) do_dashes=false;
    else do_dashes=true;

    for(i=0; i < bad_urls.length; i++)
    {
        if(the_url.indexOf(bad_urls[i])!==-1) return true;
    }
    // -1 means we just check for specific bad stuff, not length
    if(max_depth!==-1 && the_url.split("/").length>max_depth) return true;
    if(the_url.split("/").length >= 4 && do_dashes &&
       the_url.split("/")[3].split("-").length>max_dashes) return true;
    return false;
}

/* Can be improved greatly, need a good way to parse addresses globally */
MTurkScript.prototype.my_parse_address=function(to_parse)
{
    var ret_add={};
    var state_re=/([A-Za-z]+) ([\d\-]+)$/;
    var canada_zip=/ ([A-Z]{2}) ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
    to_parse=to_parse.replace(canada_zip,", $&");

    console.log("to_parse="+to_parse);
    var my_match;
    var splits=to_parse.split(",");
    if(splits.length===3)
    {
        if(canada_zip.test(splits[2]))
        {
            my_match=splits[2].match(canada_zip);
            ret_add.state=my_match[1];
            ret_add.zip=my_match[2];
        }
        else
        {
            my_match=splits[2].match(state_re);
            if(my_match!==null && my_match!==undefined)
            {
                ret_add.state=my_match[1];
                ret_add.zip=my_match[2];
            }
        }
        ret_add.street=splits[0].trim();
        ret_add.city=splits[1].trim();
    }
    else if(splits.length==2)
    {

        if(canada_zip.test(splits[1]))
        {
            my_match=splits[1].match(canada_zip);
            ret_add.state=my_match[1];
            ret_add.zip=my_match[2];
        }
        else
        {
            my_match=splits[1].match(state_re);
            if(my_match!==null && my_match!==undefined)
            {
                ret_add.state=my_match[1];
                ret_add.zip=my_match[2];
            }
        }
        ret_add.street="";
        ret_add.city=splits[0].trim();
    }
    if(ret_add.city===undefined || ret_add.state===undefined || ret_add.zip===undefined)
    {
        to_parse=to_parse.replace(/\, ([\d]{5})\,? ([A-Z]{2})/, ", $2 $1");
        console.log("to_parse="+to_parse);
        var new_add=parseAddress.parseLocation(to_parse);
        ret_add.street="";
        if(new_add.number!==undefined)
        {
            ret_add.street=ret_add.street+new_add.number+" ";
        }
        ret_add.street=ret_add.street+new_add.street+" ";
        if(new_add.type!==undefined)
        {
            ret_add.street=ret_add.street+new_add.type;
        }
        ret_add.street=ret_add.street.trim();
        ret_add.city=new_add.city;
        ret_add.state=new_add.state;
        if(new_add.zip!==undefined) { ret_add.zip=new_add.zip; }
        else { ret_add.zip=""; }
        console.log("new_add="+JSON.stringify(new_add));
    }
    return ret_add;
}
MTurkScript.prototype.get_domain_only=function(the_url,limit_one)
{
    var httpwww_re=/https?:\/\/www\./;
    var http_re=/https?:\/\//;
    var slash_re=/\/.*$/;
    var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");

    if(limit_one)
    {
        if(/\.(co|ac|gov)\.[A-Za-z]{2}$/.test(the_url))
        {
            ret=ret.replace(/^.*\.([^\.]+\.(?:co|ac|gov)\.[A-Za-z]{2})$/,"$1");
        }
        else ret=ret.replace(/^.*\.([^\.]+\.[^\.]+$)/,"$1");
    }
    return ret;
}
MTurkScript.prototype.prefix_in_string=function(prefixes, to_check)
{
    var j;
    for(j=0; j < prefixes.length; j++) {
        if(to_check.indexOf(prefixes[j])===0) return true;

    }
    return false;
}
MTurkScript.prototype.parse_name=function(to_parse)
{
    console.log("Doing parse_name on "+to_parse);
    var suffixes=["Jr","II","III","IV","CPA","CGM"];
    var prefixes=["Mr","Ms","Mrs","Dr","Rev"];
    var prefixes_regex=/^(Mr|Ms|Mrs|Dr|Rev|Miss)\.?\s+/gi;
    var paren_regex=/\([^\)]*\)/g;
    to_parse=to_parse.replace(paren_regex,"");
    to_parse=to_parse.replace(prefixes_regex,"");
    var split_parse=to_parse.split(" ");
    var last_pos=split_parse.length-1;
    var first_pos=0;
    var j;
    var caps_regex=/^[A-Z]+$/;
    var ret={};
    for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
    {
        if(!this.prefix_in_string(suffixes,split_parse[last_pos]))
        {
            if(!(split_parse.length>0 && /[A-Z][a-z]/.test(split_parse[0]) && /^[^a-z]+$/.test(split_parse[last_pos])))
            {
                //console.log("last_pos="+last_pos);
                //console.log( /[A-Z][a-z]/.test(split_parse[0]));

                break;
            }
        }



    }
    if(last_pos>=2 && /Van|de/.test(split_parse[last_pos-1]))
    {
        ret.lname=split_parse[last_pos-1]+" "+split_parse[last_pos];
    }
    else ret.lname=split_parse[last_pos];
    ret.fname=split_parse[0];
    if(last_pos>=2 && split_parse[1].length>=1) {
        ret.mname=split_parse[1].substring(0,1); }
    else {
        ret.mname=""; }


    return ret;

}

MTurkScript.prototype.shorten_company_name=function(name)
{
    name=removeDiacritics(name).replace(/ - .*$/,"").trim().replace(/\s*plc$/i,"");
    name=name.replace(/\(.*$/i,"").trim();
    name=name.replace(/\s*Corporation$/i,"").replace(/\s*Corp\.?$/i,"");
    name=name.replace(/\s*Incorporated$/i,"").replace(/\s*Inc\.?$/i,"");
    name=name.replace(/\s*LLC$/i,"").replace(/\s*Limited$/i,"").replace(/\s*Ltd\.?$/i,"").trim();

    name=name.replace(/,\s*$/,"");
    name=name.replace(/\s+Pte$/i,"").replace(/ AG$/i,"");
    name=name.replace(/\s+S\.?A\.?$/i,"").replace(/\s+L\.?P\.?$/i,"");
    name=name.replace(/\s+GmbH$/i,"").replace(/\s+SRL/i,"")
    name=name.replace(/\s+Sarl$/i,"");
    name=name.replace(/[,\.]+$/,"");
    name=name.replace(/\sCo\.?$/i,"");

    return name;
}


/* do_bloomberg_snapshot parses
 * https://www.bloomberg.com/research/stocks/private/snapshot.asp?privcapId=[\d+] pages
 * doc the document to use to parse it, to allow use for either xmlhttprequest or open in
 *       new window
 */
MTurkScript.prototype.parseext_bloomberg_snapshot=function(doc)
{
    console.log("Doing bloomberg ");

    var result={"phone":"","country":"",url:"","name":"","state":"","city":"","streetAddress":"","postalCode":""};

    var address=doc.querySelector("[itemprop='address']");
    var phone=doc.querySelector("[itemprop='telephone']");
    var name=doc.querySelector("[itemprop='name']");
    var url=doc.querySelector("[itemprop='url']");
    var executives=doc.querySelectorAll("[itemprop='member']");
    var add_match, add_regex=/^([^,]+)(?:,\s*(.*?))?\s*((?:[A-Z]*[\d]+[A-Z\d]+[A-Z]*))$/;

    if(phone!==null && phone!==undefined) result.phone=phone.innerText;

    if(address!==null && address!==undefined)
    {
        var add_split=address.innerText.split("\n");
        var add_len=add_split.length;
        var curr_pos=add_len-1,i;

        while(curr_pos>=0 && add_split[curr_pos].length<2) curr_pos--;
        console.log("add_len="+add_len);
        if(curr_pos>=0) {
            result.country=add_split[curr_pos]; }
        curr_pos--;
        while(curr_pos>=0 && add_split[curr_pos].length<2) curr_pos--;
        if(curr_pos>=0) {
            add_match=add_split[curr_pos].match(add_regex);
            console.log("add_match="+JSON.stringify(add_match));
            if(add_match)
            {
                result.city=add_match[1];
                result.state=add_match[2];
                result.postalCode=add_match[3];
            }

        }

        result.streetAddress="";
        for(i=0; i < curr_pos; i++)
        {
            if(add_split[i].length<2) continue;
            result.streetAddress=result.streetAddress+add_split[i];
            if(i<curr_pos-1) result.streetAddress=result.streetAddress+",";
        }
        result.streetAddress=result.streetAddress.replace(/,$/,"");
    }
    if(url!==undefined && url!==null) { result.url=url.href; }
    if(name!==undefined && name!==null) { result.name=name.innerText; }
    console.log("this="+this.prototype);
    result.name=MTurkScript.prototype.shorten_company_name(result.name);
    console.log("result="+JSON.stringify(result));
    console.log("Setting bloom_result");
    GM_setValue("bloomberg.com/research/stocks/private/snapshot.asp"+"_result",result);
    return;


}

MTurkScript.prototype.parseext_bloomberg_profile=function(doc)
{
    var result={"phone":"","country":"",url:"","name":"","state":"","city":"","streetAddress":"","postalCode":"",
                sector:"","industry":"","sub_industry":"",executives:[],description:""};
    var i;
    var address=document.getElementsByClassName("address");
    var phone=doc.querySelector("[itemprop='telephone']");
    var name=doc.querySelector("[itemprop='name']");
    var url=document.getElementsByClassName("website");
    var executives=document.getElementsByClassName("executive");
    var desc=document.getElementsByClassName("description");
    var fields=["sector","industry","sub_industry"];
    var add_match, add_regex=/^([^,]+)(?:,\s*(.*?))?\s*((?:[A-Z]*[\d]+[A-Z\d]+[A-Z]*))$/;
    if(desc.length>0) result.description=desc[0].innerText;
    for(i=0; i < fields.length; i++)
    {
        let curr_field=document.getElementsByClassName(fields[i]);
        if(curr_field.length>0) result[fields[i]]=curr_field[0].innerText.replace(/^[^:]+:\s*/,"");
    }
    for(i=0; i < executives.length; i++)
    {
        try
        {
            result.executives.push({name:executives[i].getElementsByClassName("name")[0].innerText,
                                    position:executives[i].getElementsByClassName("position")[0].innerText});
        }
        catch(error) { console.log("error pushing "+error); }
    }
    if(url.length>0 && url[0].getElementsByTagName("a").length>0) { result.url=url[0].getElementsByTagName("a")[0].href; }
    if(name!==undefined && name!==null) { result.name=name.content; }
    if(phone!==null && phone!==undefined) result.phone=phone.content;
    if(address.length>0)
    {
        var add_split=address[0].innerText.split("\n");
        let curr_pos=add_split.length-1;
        if(curr_pos>0) result.country=add_split[curr_pos--].trim();
        if(curr_pos>=0) {
            add_match=add_split[curr_pos].match(add_regex);
            console.log("add_match="+JSON.stringify(add_match));
            if(add_match)
            {
                result.city=add_match[1];
                result.state=add_match[2];
                result.postalCode=add_match[3];
            }

        }
        for(i=0; i < curr_pos; i++)
        {
            if(add_split[i].length<2) continue;
            result.streetAddress=result.streetAddress+add_split[i];
            if(i<curr_pos-1) result.streetAddress=result.streetAddress+",";
        }


    }
    console.log("result="+JSON.stringify(result));
    console.log("Setting bloom_result");
    GM_setValue("bloomberg.com/profiles/companies/"+"_result",result);
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
 * parse_instagram parses an instagram page, scrapes page name, insta_name (the instagram handle sans @), followers,posts, following,
 url of instagram, an external url linked to if existing, description */
MTurkScript.prototype.parseext_instagram=function(doc,instance,fragment)
{
    if(instance===undefined) {
	console.log("instance is undefined"); return; }
    console.log("Doing IG attempts="+instance.attempts[fragment]);
    var j,x;
    // for(x in instance) { console.log("instance["+x+"]="+instance[x]); }
    var result={email:"",name:"",insta_name:"",followers:"",url:window.location.href,posts:"",following:"",
                external_url:"",description:""};
    var accountname=doc.getElementsByClassName("AC5d8");
    var name=doc.getElementsByClassName("rhpdm");
    var counts=doc.getElementsByClassName("g47SY");
    var text_div=doc.getElementsByClassName("-vDIg");

    var error_container=doc.getElementsByClassName("error-container");
    if(accountname.length===0) {
        console.log("Calling reload_parser");
        instance.reload_parser(doc,instance,fragment);
        return;
    }

    if(error_container.length>0)
    {
        result.insta_name=window.location.href.replace(/https:\/\/(www\.)?instagram\.com\//,"").replace(/\//g,"");
    }
    if(accountname.length>0) result.insta_name="@"+accountname[0].innerText;
    if(name.length>0) result.name=name[0].innerText.replace(/|.*$/,"").trim() ;
    if(counts.length>=3)
    {
        result.posts=counts[0].innerText.replace(/[\.\,]+/g,"");
        result.followers=counts[1].innerText.replace(/[\.\,]+/g,"");
        result.following=counts[2].innerText.replace(/[\.\,]+/g,"");
    }
    if(text_div.length>0)
    {
        var email_matches=text_div[0].innerText.match(email_re);
        if(email_matches!==null && email_matches.length>0)
        {
            for(j=0; j < email_matches.length; j++)
            {
                if(!MTurkScript.is_bad_email(email_matches[j])) {

                    result.email=email_matches[j];
                    break;
                }
            }
        }
        if(text_div[0].getElementsByTagName("span").length>0) result.description=text_div[0].getElementsByTagName("span")[0].innerText;
        if(text_div[0].getElementsByClassName("yLUwa").length>0)
        {
            let url_match=text_div[0].getElementsByClassName("yLUwa")[0].href.match(/\?u\=([^&]+)&/);
            if(url_match) result.external_url=decodeURIComponent(url_match[1]);
        }
    }
    console.log("Done IG, result="+JSON.stringify(result));

    GM_setValue("instagram.com_result",result);
};

/* parse_b_context parses the b_context on Bing search
   puts the b_vList fields (e.g. Address, Phone) into the results under the
   name given on Bing,  puts b_entityTitle in Name
*/
MTurkScript.prototype.parse_b_context=function(b_context)
{
    var b_vList,i,bm_details_overlay,inner_li,b_entityTitle,b_entitySubTitle;
    var b_hList,inner_a;
    b_vList=b_context.getElementsByClassName("b_vList");
    b_hList=b_context.getElementsByClassName("b_hList");
    

    var field_regex=/^([^:]+):\s*(.*)$/,field_match,result={};
    b_entityTitle=b_context.getElementsByClassName("b_entityTitle");
    b_entitySubTitle=b_context.getElementsByClassName("b_entitySubTitle");
    if(b_entityTitle.length>0) result.Title=b_entityTitle[0].innerText;
    if(b_entitySubTitle.length>0) result.SubTitle=b_entitySubTitle[0].innerText;

    if(b_vList.length>0)
    {
        inner_li=b_vList[0].getElementsByTagName("li");
        for(i=0; i<inner_li.length; i++)
        {
            field_match=inner_li[i].innerText.match(field_regex);
            if(field_match) result[field_match[1]]=field_match[2];
        }

    }
    if(b_hList.length>0)
    {
	inner_a=b_hList[0].getElementsByTagName("a");
        for(i=0; i<inner_a.length; i++)
        {
	    result[inner_a[i].innerText]=inner_a[i].href;
        }
    }
    return result;
};

MTurkScript.prototype.parse_lgb_info=function(lgb_info)
{
    var result={"phone":"","name":"",url:""},bm_details_overlay,b_factrow,i,b_entityTitle;
    b_entityTitle=lgb_info.getElementsByClassName("b_entityTitle");
    bm_details_overlay=lgb_info.getElementsByClassName("bm_details_overlay");
    if(bm_details_overlay.length>0) result.address=bm_details_overlay[0].innerText;
    b_factrow=lgb_info.getElementsByClassName("b_factrow");
    if(b_entityTitle.length>0)
    {
	result.name=b_entityTitle[0].innerText;
	if(b_entityTitle[0].getElementsByTagName("a").length>0)
	{
	    result.url=b_entityTitle[0].getElementsByTagName("a")[0].href;
	}
    }
    for(i=0; i < b_factrow.length; i++)
    {
        if(phone_re.test(b_factrow[i].innerText)) result.phone=b_factrow[i].innerText;
    }
    return result;
};

MTurkScript.prototype.add_to_sheet=function()
{
    for(var x in my_query.fields) {
        if(document.getElementById(x) && my_query.fields[x].length>0)
        {
            document.getElementById(x).value=my_query.fields[x];
        }
    }
};

/* Creates a promise where it does a standard GM_xmlhttpRequest GET thing, on which point it
   does the DOMParser thing, loads the parser taking (doc,url,resolve,reject)

   and the promise does (mandatory) then_func on resolving, (optional, otherwise just prints a message) catch_func on
   rejecting
*/
MTurkScript.prototype.create_promise=function(url, parser, then_func, catch_func,extra_arg)
{
    if(catch_func===undefined) catch_func=MTurkScript.prototype.my_catch_func;

    const queryPromise = new Promise((resolve, reject) => {
        GM_xmlhttpRequest(
            {method: 'GET', url: url,
             onload: function(response) {
                 var doc = new DOMParser()
                     .parseFromString(response.responseText, "text/html");
                 if(extra_arg!==undefined) parser(doc,response.finalUrl, resolve, reject,extra_arg);
                 else parser(doc,response.finalUrl, resolve, reject);
             },
             onerror: function(response) { reject("Failed to load site "+response); },
             ontimeout: function(response) {reject("Timed out loading site "+response); }
            });
    });
    queryPromise.then(then_func)
        .catch(catch_func);
    return queryPromise;
};

MTurkScript.prototype.my_then_func=function(response) {  };

MTurkScript.prototype.my_catch_func=function(response) { console.log("Request to url failed"); };
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
        // p1 is nondigits, p2 digits, and p3 non-alphanumerics
        var result={closed:false,open:"",close:""};
        if(hr_match[2]===null||hr_match[2]===undefined)
        {
            result.closed=true;
	    return result;
        }
        result.open=MTurkScript.prototype.adjust_time(hr_match[2],hr_match[3],hr_match[4]);
        result.close=MTurkScript.prototype.adjust_time(hr_match[5],hr_match[6],hr_match[7]);
        return result;
};

    /* parse hours is a helper for parse_FB_about */
MTurkScript.prototype.parse_hours=function(script)
{
    var result={};
    var text=script.innerHTML.replace(/^require\(\"TimeSlice\"\)\.guard\(\(function\(\)\{bigPipe\.onPageletArrive\(/,"")
        .replace(/\);\}\).*$/,"")
    text=text.replace(/([\{,]{1})([A-Za-z0-9_]+):/g,"$1\"$2\":").replace(/\\x3C/g,"<");
    var parsed_text=JSON.parse(text);
    var instances=parsed_text.jsmods.instances;
    if(!instances || instances===undefined) { return result; }
    var x,i,j,good_instance,hr_match;
    var hr_regex=/^([A-Za-z]+):\s*(?:CLOSED|([\d]{1,2}):([\d]{2})\s*([A-Z]{2})\s*-\s*([\d]{1,2}):([\d]{2})\s*([A-Z]{2}))/i;
    for(i=0; i < instances.length; i++)
    {
        try
        {
            if(instances[i].length>=3 && instances[i][1].length>0 && instances[i][1][0]==="Menu"
               && instances[i][2].length>0)
            {

                good_instance=instances[i][2][0];
                for(j=0; j < good_instance.length; j++) {
                    console.log("good_instance["+j+"].label="+good_instance[j].label);
                    if(good_instance[j].label!==undefined && hr_regex.test(good_instance[j].label))
                    {
                        hr_match=good_instance[j].label.match(hr_regex);
                        console.log("hr_match at "+j+"="+JSON.stringify(hr_match));
                        result[hr_match[1]]=MTurkScript.prototype.parse_hr_match(hr_match);

                    }
                }
            }
        }
        catch(error) { console.log("error with hours "+error); }
    }
    return result;

};

MTurkScript.prototype.FB_match_coords = function(src)
{
    var result={};
    var coords_regex=/markers=([-\d\.]+)%2C([-\d\.]+)/,coords_match;
    coords_match=src.match(coords_regex);
    if(coords_match)
    {
        result.lat=coords_match[1];
        result.lon=coords_match[2];
    }
    return result;
};

    /**
     * parse_FB_about is a create_promise style parser for a FB about page
     */
MTurkScript.prototype.parse_FB_about=function(doc,url,resolve,reject)
{
    // console.time("fb_about");
    //console.log("this="+JSON.stringify(this));
    var result={};
    var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts;
    for(i=0; i < scripts.length; i++)
    {
        if(/^bigPipe\.beforePageletArrive\(\"PagesProfileAboutInfoPagelet/.test(scripts[i].innerHTML) && i < scripts.length-1)
        {
            /* Parse the next one */
            result.hours=MTurkScript.prototype.parse_hours(scripts[i+1]);
        }
    }
    for(i=0; i < code.length; i++)
    {
        //console.log("code ("+i+")");
        code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    }
    var about_fields=doc.getElementsByClassName("_3-8j"),inner_field1,text;
    var _a3f=doc.getElementsByClassName("_a3f"),coord_ret; // map with coords

    if(_a3f.length>0 && (coord_ret=MTurkScript.prototype.FB_match_coords(_a3f[0].src))) {
        for(i in coord_ret) result[i]=coord_ret[i];
    }

    for(i=0; i < about_fields.length; i++)
    {
        //  console.log("about_fields["+i+"].className="+about_fields[i].className);
        inner_field1=about_fields[i].getElementsByClassName("_50f4");
        if(about_fields[i].className.toString().indexOf("_5aj7")!==-1 &&
           about_fields[i].className.toString().indexOf("_20ud")!==-1 &&
           about_fields[i].getElementsByClassName("_4bl9").length>0)
        {
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
        else if(/^About$/i.test(text) && about_fields[i].getElementsByClassName("_3-8w").length>0) {
            result.about=about_fields[i].getElementsByClassName("_3-8w")[0].innerText; }


    }
    //console.log("result="+JSON.stringify(result));
    resolve(result);
    //console.timeEnd("fb_about");
};
/* parse_search_script parses the script to get the search results; a helper function 
   for parse_FB_search
*/
MTurkScript.prototype.parse_search_script=function(script)
{
    var result={success:true,sites:[]},parsed_text="",i,j;
    var text=script.innerHTML.replace(/^require\(\"TimeSlice\"\)\.guard\(\(function\(\)\{bigPipe\.onPageletArrive\(/,"")
        .replace(/\);\}\).*$/,"")
    
    text=text.replace(/src:\"([^\"]+)\"/g,"src:\"\"");
    text=text.replace(/([\{,]{1})([A-Za-z0-9_]+):/g,"$1\"$2\":").replace(/\\x3C/g,"<")
	.replace(/%23/g,"#");
    try
    {
	
	parsed_text=JSON.parse(text);
    }
    catch(error) { console.log("Error "+error+" when parsing\n"+text);

		   var err_regex=/at position ([\d]+)/,err_match;
		   err_match=error.toString().match(err_regex);
		   if(err_match)
		   {
		       console.log("Context of error: "+text.substr(parseInt(err_match[1])-100,200));
		   }


		 }
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



    for(i=0; i < scripts.length; i++)
    {
        // console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);

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
 * match_home_text Returns list of two fields, either both blank or the first label, second value
 * helper for parse_FB_home
 */
MTurkScript.prototype.match_home_text=function(text)
{

    var ret=["",""];
    var follow_re=/^([\d\,]+) people follow this/,like_re=/^([\d\,]+) people like this/;
    if(phone_re.test(text)) ret=["phone",text.match(phone_re)[0]];
    else if(email_re.test(text)) ret=["email",text.match(email_re)[0]];
    else if(follow_re.test(text)) ret=["followers",text.match(follow_re)[1].replace(/,/g,"")];
    else if(like_re.test(text)) ret=["likes",text.match(like_re)[1].replace(/,/g,"")];
    return ret;
};

/**
 * match_home_a Returns list of two fields, either both blank or the first label, second value
 * helper for parse_FB_home
 */
MTurkScript.prototype.match_home_a=function(inner_a,text)
{
    var ret=["",""],i;
    var url_regex=/\.php\?u=(.*)$/;
    if(url_regex.test(inner_a[0].href) &&
       !/Get Directions/.test(inner_a[0].innerText))
    {
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

MTurkScript.prototype.parse_FB_home=function(doc,url,resolve,reject)
{
    var result={success:true,fb_url:url},outer_part,_4bl9,i,j,inner_a,response,_4j7v;
    var _a3f,coord_ret,address;
    var code=doc.body.getElementsByTagName("code"),scripts=doc.scripts;
    for(i=0; i < code.length; i++)
    {
        code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    }
    outer_part=doc.getElementsByClassName("_1xnd");
    if(outer_part.length===0)
    {
        result.success=false;
        resolve(result);
        return;
    }
    _a3f=doc.getElementsByClassName("_a3f"); // map with coords
    if(_a3f.length>0 && (coord_ret=MTurkScript.prototype.FB_match_coords(_a3f[0].src))) {
        for(i in coord_ret) result[i]=coord_ret[i];
    }
    _4bl9=outer_part[0].getElementsByClassName("_4bl9");
    for(i=0; i < _4bl9.length; i++)
    {
        if(_4bl9[i].getElementsByClassName("_2wzd").length>0 &&
           (address=parseAddress.parseLocation(_4bl9[i].innerText.replace(/\n/g,",")
					       .replace(/\s*\([^\)]+\)\s*/g,"")
                                               .replace(/\s*\d[A-Za-z]{1,2}\s*floor\s*/i," ")
					       .replace(/(Ste(\.?)|Suite) [\d]+/,"")
					       .replace(/Unit [A-Za-z\-\d]+,/,"")
					       .replace(/P(\.|\s)?O(\.|\s)? Box [\d\-]+,/i,"123 Fake Street,")

					      ))
           && address)
	{
	    result.address=address;
	    result.addressInner=_4bl9[i].innerText.replace(/Get Directions$/,"");
	}
	
        inner_a=_4bl9[i].getElementsByTagName("a");
        if(inner_a.length===0 && (response=MTurkScript.prototype.match_home_text(_4bl9[i].innerText))
           && response[0].length>0) result[response[0]]=response[1];
        else if(inner_a.length>0 && (response=MTurkScript.prototype.match_home_a(inner_a))
                && response[0].length>0) result[response[0]]=response[1];
    }
    resolve(result);
};

/**
     * parse_insta_script is a helper for parse_instagram that extracts the useful data
     */
 MTurkScript.prototype.parse_insta_script=function(parsed)
    {
        var x,y,z;
        var user=parsed.entry_data.ProfilePage[0].graphql.user;
        var result={success:true,followers:"",following:"",name:"",
                    username:"",url:"",is_business:false,email:"",phone:"",
                   category:"",address:{},biography:""};
        if(user.edge_followed_by!==undefined &&
           user.edge_followed_by.count!==undefined) result.followers=user.edge_followed_by.count;
         if(user.edge_follow!==undefined &&
           user.edge_follow.count!==undefined) result.following=user.edge_follow.count;
        if(user.full_name!==undefined) result.name=user.full_name;
        if(user.username!==undefined) result.username=user.username;
        if(user.external_url!==undefined) result.url=user.external_url;
        if(user.is_business_account!==undefined) result.is_business=user.is_business_account;
        if(user.business_email) result.email=user.business_email;
        if(user.business_address_json)
        {
            let temp_add=JSON.parse(user.business_address_json);
            result.address={addressLine1:temp_add.street_address, city:temp_add.city_name.replace(/,.*$/,""),
                            state:temp_add.region_name, country:"",country_code:temp_add.country_code};
            if(result.address.state.length===0) result.address.state=temp_add.city_name.replace(/^[^,]*,\s*/,"");
        }
        if(user.biography) result.biography=user.biography;
        if(user.business_phone_number) result.phone=user.business_phone_number;
        return result;
    }

/** parser for instagram to read the data */
MTurkScript.prototype.parse_instagram=function(doc,url,resolve,reject)
{
    var scripts=doc.scripts,i,j,parsed;
    var script_regex=/^window\._sharedData\s*\=\s*/;
    var result={success:false};
    for(i=0; i < scripts.length; i++)
    {
        if(script_regex.test(scripts[i].innerHTML))
        {
            parsed=JSON.parse(scripts[i].innerHTML.replace(script_regex,"").replace(/;$/,""));
            result=MTurkScript.prototype.parse_insta_script(parsed);
            resolve(result);
            break;
        }
    }
    resolve(result);
    return;
};

/* Parse FB_search parses a search for PAGES on Facebook */
MTurkScript.prototype.parse_FB_search_page=function(doc,url,resolve,reject)
{
    var result={success:false,sites:[]};
    var code=doc.body.getElementsByTagName("code"),i,j,name,desc;
    try
    {
        for(i=0; i < code.length; i++)
        {
            //console.log("code ("+i+")");
            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }
        name=doc.getElementsByClassName("_32mo")
        desc=doc.getElementsByClassName("_glo");
        for(i=0; i < name.length; i++)
        {
            result.sites.push({name:name[i].innerText,url:name[i].href,text:desc[i].innerText});
        }
        result.success=true;

    }
    catch(error) { console.log("Error in parse_FB_search_page "+error); result.success=false; }
    resolve(result);
};

MTurkScript.prototype.parse_FB_posts=function(doc,url,resolve,reject)
{
    var scripts=doc.scripts,i,j;
    var code=doc.body.getElementsByTagName("code");
    var result={success:false},time;
    for(i=0; i < code.length; i++)
    {
        code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    }
    var posts=doc.getElementsByClassName("mbm");
    for(i=0; i < posts.length; i++)
    {
        if(posts[i].getElementsByClassName("_449j").length===0) break;
    }
    if(i>=posts.length || !(time=posts[i].getElementsByClassName("_5ptz")) ||
       time.length===0 || !time[0].title || time[0].title.split(" ").length<2)
    {

        resolve(result);
        return;
    }

    result={success:true,date:time[0].title.split(" ")[0],time:time[0].title.split(" ")[1]};
    resolve(result);

};
/* fix_remote_urls fixes the remote urls so they aren't having the mturkcontent.com stuff
     * found_url is the url that needs fixing
     *  page_url is the url from response.finalUrl
    */
MTurkScript.prototype.fix_remote_url=function(found_url,page_url)
{
    var replacement=page_url.match(/^https?:\/\/[^\/]+/);
    var to_replace= window.location.href.match(/^https?:\/\/[^\/]+/)[0];
    var curr_url=window.location.href, temp_url=curr_url.replace(/\/$/,"");
    while(temp_url.split("/").length>=3)
    {
        found_url=found_url.replace(temp_url,replacement);
        temp_url=temp_url.replace(/\/[^\/]+$/,"");
    }
    return found_url.replace(to_replace,replacement);
};
