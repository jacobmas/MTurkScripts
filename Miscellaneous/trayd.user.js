// ==UserScript==
// @name         trayd
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.facebook.com/*

// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["rocketreach.co"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(45000,750+(Math.random()*1000),[],begin_script,"A25D3ERQS4M1CX",true);
    var MTP=MTurkScript.prototype;
    var country_map={"AF":"Afghanistan","AX":"\u00c5land Islands","AL":"Albania","DZ":"Algeria","AS":"American Samoa","AD":"Andorra","AO":"Angola","AI":"Anguilla","AQ":"Antarctica","AG":"Antigua and Barbuda","AR":"Argentina","AM":"Armenia","AW":"Aruba","AU":"Australia","AT":"Austria","AZ":"Azerbaijan","BS":"Bahamas","BH":"Bahrain","BD":"Bangladesh","BB":"Barbados","BY":"Belarus","BE":"Belgium","BZ":"Belize","BJ":"Benin","BM":"Bermuda","BT":"Bhutan","BO":"Bolivia, Plurinational State of","BQ":"Bonaire, Sint Eustatius and Saba","BA":"Bosnia and Herzegovina","BW":"Botswana","BV":"Bouvet Island","BR":"Brazil","IO":"British Indian Ocean Territory","BN":"Brunei Darussalam","BG":"Bulgaria","BF":"Burkina Faso","BI":"Burundi","KH":"Cambodia","CM":"Cameroon","CA":"Canada","CV":"Cape Verde","KY":"Cayman Islands","CF":"Central African Republic","TD":"Chad","CL":"Chile","CN":"China","CX":"Christmas Island","CC":"Cocos (Keeling) Islands","CO":"Colombia","KM":"Comoros","CG":"Congo","CD":"Congo, the Democratic Republic of the","CK":"Cook Islands","CR":"Costa Rica","CI":"C\u00f4te d'Ivoire","HR":"Croatia","CU":"Cuba","CW":"Cura\u00e7ao","CY":"Cyprus","CZ":"Czech Republic","DK":"Denmark","DJ":"Djibouti","DM":"Dominica","DO":"Dominican Republic","EC":"Ecuador","EG":"Egypt","SV":"El Salvador","GQ":"Equatorial Guinea","ER":"Eritrea","EE":"Estonia","ET":"Ethiopia","FK":"Falkland Islands (Malvinas)","FO":"Faroe Islands","FJ":"Fiji","FI":"Finland","FR":"France","GF":"French Guiana","PF":"French Polynesia","TF":"French Southern Territories","GA":"Gabon","GM":"Gambia","GE":"Georgia","DE":"Germany","GH":"Ghana","GI":"Gibraltar","GR":"Greece","GL":"Greenland","GD":"Grenada","GP":"Guadeloupe","GU":"Guam","GT":"Guatemala","GG":"Guernsey","GN":"Guinea","GW":"Guinea-Bissau","GY":"Guyana","HT":"Haiti","HM":"Heard Island and McDonald Islands","VA":"Holy See (Vatican City State)","HN":"Honduras","HK":"Hong Kong","HU":"Hungary","IS":"Iceland","IN":"India","ID":"Indonesia","IR":"Iran, Islamic Republic of","IQ":"Iraq","IE":"Ireland","IM":"Isle of Man","IL":"Israel","IT":"Italy","JM":"Jamaica","JP":"Japan","JE":"Jersey","JO":"Jordan","KZ":"Kazakhstan","KE":"Kenya","KI":"Kiribati","KP":"Korea, Democratic People's Republic of","KR":"Korea, Republic of","KW":"Kuwait","KG":"Kyrgyzstan","LA":"Lao People's Democratic Republic","LV":"Latvia","LB":"Lebanon","LS":"Lesotho","LR":"Liberia","LY":"Libya","LI":"Liechtenstein","LT":"Lithuania","LU":"Luxembourg","MO":"Macao","MK":"Macedonia, the Former Yugoslav Republic of","MG":"Madagascar","MW":"Malawi","MY":"Malaysia","MV":"Maldives","ML":"Mali","MT":"Malta","MH":"Marshall Islands","MQ":"Martinique","MR":"Mauritania","MU":"Mauritius","YT":"Mayotte","MX":"Mexico","FM":"Micronesia, Federated States of","MD":"Moldova, Republic of","MC":"Monaco","MN":"Mongolia","ME":"Montenegro","MS":"Montserrat","MA":"Morocco","MZ":"Mozambique","MM":"Myanmar","NA":"Namibia","NR":"Nauru","NP":"Nepal","NL":"Netherlands","NC":"New Caledonia","NZ":"New Zealand","NI":"Nicaragua","NE":"Niger","NG":"Nigeria","NU":"Niue","NF":"Norfolk Island","MP":"Northern Mariana Islands","NO":"Norway","OM":"Oman","PK":"Pakistan","PW":"Palau","PS":"Palestine, State of","PA":"Panama","PG":"Papua New Guinea","PY":"Paraguay","PE":"Peru","PH":"Philippines","PN":"Pitcairn","PL":"Poland","PT":"Portugal","PR":"Puerto Rico","QA":"Qatar","RE":"R\u00e9union","RO":"Romania","RU":"Russian Federation","RW":"Rwanda","BL":"Saint Barth\u00e9lemy","SH":"Saint Helena, Ascension and Tristan da Cunha","KN":"Saint Kitts and Nevis","LC":"Saint Lucia","MF":"Saint Martin (French part)","PM":"Saint Pierre and Miquelon","VC":"Saint Vincent and the Grenadines","WS":"Samoa","SM":"San Marino","ST":"Sao Tome and Principe","SA":"Saudi Arabia","SN":"Senegal","RS":"Serbia","SC":"Seychelles","SL":"Sierra Leone","SG":"Singapore","SX":"Sint Maarten (Dutch part)","SK":"Slovakia","SI":"Slovenia","SB":"Solomon Islands","SO":"Somalia","ZA":"South Africa","GS":"South Georgia and the South Sandwich Islands","SS":"South Sudan","ES":"Spain","LK":"Sri Lanka","SD":"Sudan","SR":"Suriname","SJ":"Svalbard and Jan Mayen","SZ":"Swaziland","SE":"Sweden","CH":"Switzerland","SY":"Syrian Arab Republic","TW":"Taiwan, Province of China","TJ":"Tajikistan","TZ":"Tanzania, United Republic of","TH":"Thailand","TL":"Timor-Leste","TG":"Togo","TK":"Tokelau","TO":"Tonga","TT":"Trinidad and Tobago","TN":"Tunisia","TR":"Turkey","TM":"Turkmenistan","TC":"Turks and Caicos Islands","TV":"Tuvalu","UG":"Uganda","UA":"Ukraine","AE":"United Arab Emirates","GB":"United Kingdom","US":"United States","UM":"United States Minor Outlying Islands","UY":"Uruguay","UZ":"Uzbekistan","VU":"Vanuatu","VE":"Venezuela, Bolivarian Republic of","VN":"Viet Nam","VG":"Virgin Islands, British","VI":"Virgin Islands, U.S.","WF":"Wallis and Futuna","EH":"Western Sahara","YE":"Yemen","ZM":"Zambia","ZW":"Zimbabwe"};
    var country_list=["England","Scotland","Wales"];
    var province_list=[];


    for(let x in country_map) country_list.push(country_map[x]);
    for(let x in province_map) province_list.push(x.toLowerCase());

    if(/\.facebook\.com/.test(window.location.href)) {
        GM_addValueChangeListener("facebook",function() {
            console.log("arguments=",arguments);
            window.location.href=arguments[2].url;
        });

        setTimeout(parse_FB,2500);

    }

    function is_bad_name(b_name)
    {
        return false;
    }

    function add_address(add) {
        var add2 = new Address(add);
        if(add2.city && add2.state) {
            my_query.fields.city=add2.city;
            my_query.fields.state=add2.state;
            if(province_list.includes(add2.state.trim().toLowerCase())) my_query.fields.country="Canada";
            else my_query.fields.country="USA";
        }
        else console.log("add2=",add2);
    }

    function parse_FB() {
        console.log("parse FB");
        var result={};
        var ul=document.querySelector(".x1yztbdb.xdt5ytf.x78zum5 .c");
        if(!ul) ul=document.querySelector(".x1yztbdb.xdt5ytf.x78zum5 > .xdt5ytf");
        if(!ul) ul=document.querySelector("ul");
        var item;
        for(item of ul.children) {
            let add=item.innerText;
             var add2 = new Address(add);
        if(add2.city) {
            result.city=add2.city;
            result.state=add2.state||"";
            if(province_map[add2.state.trim()]!==undefined) result.country="Canada";
            else result.country="USA";
        }
        else console.log("add2=",add2);
            let a =item.querySelector("a");
            if(a) {
                let temp_url=a.href;
                temp_url=decodeURIComponent(temp_url.replace("https://l.facebook.com/l.php?u=","")).replace(/\?fbclid\=.*$/,"");
                if(!/facebook\.com|^mailto:/.test(temp_url)) result.url=temp_url;
            }

            if(email_re.test(item.innerText.trim())) {
                console.log("found email in item=",item.innerText.trim());
                result.email=item.innerText.trim(); }

        }

        console.log("result=",result);
        result.date=Date.now();
        GM_setValue("result",result);

    }


    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption, parsed_b_ans;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb, b_ans;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_ans=doc.querySelector(".b_ans.b_top");

            console.log("b_algo.length="+b_algo.length);

           let ans = doc.querySelector(".qna-mf .b_focusTextMedium");
            console.log("ans=",ans);
            if(ans && type==="hq") {
                let ans_split=ans.innerText.trim().split(/,\s*/);
                if(ans_split.length===2) {
                    if(country_list.includes(ans_split[1])) {
                        my_query.fields.city=ans_split[0];
                        my_query.fields.state="N/A";
                        my_query.fields.country=ans_split[1];
                    }
                    else {
                        my_query.fields.city=ans_split[0];
                        my_query.fields.state=ans_split[1];
                        my_query.fields.country="USA";
                    }
                }
                else if(ans_split.length===1) {
                     my_query.fields.city=ans_split[0];
                    my_query.fields.state=my_query.fields.country="N/A";
                }
            }
            ans = doc.querySelector(".qna-mf strong");
            if(ans) {
                add_address(ans.innerText.trim()); }
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Address) {
                add_address(parsed_context.Address);
                if(type==="hq") {
                resolve("");
                return; }
            }
				
				if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            
				}
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.address) { add_address(parsed_lgb.address); if(type==="hq") { resolve(""); return } }
					if(type==="query" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length; i++) {
                if(type!="hq" && i>=3) break;
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && (!MTurkScript.prototype.is_bad_url(b_url, bad_urls)||/pages\/contact-us/.test(b_url)) && (!MTurkScript.prototype.is_bad_name(b_name,my_query.short_name,p_caption,i) || b_name.indexOf(my_query.short_name)!=-1)
		   && (b1_success=true)) break;
                if(type==="fb" && (!MTurkScript.prototype.is_bad_name(b_name,my_query.short_name,p_caption,i) || b_name.indexOf(my_query.short_name)!=-1)
		   && (b1_success=true)) break;
                if(type=="hq" && /zoominfo\.com/.test(b_url) && !my_query.fields.city) {
                    let hq_re=/Headquarters: ((?:.*?)[a-z], \d{5})/;
                    let hq_match;
                    if((hq_match=p_caption.match(hq_re))) {
                        add_address(hq_match[1]);
                    }
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);


        return;
    }
    function do_next_query(resolve,reject,type) {
         /*if(type==="hq" && my_query.try_count[type]===0) {
            my_query.try_count[type]+=1;
            query_search(my_query.name+" address", resolve, reject, query_response,"hq");
             return;
        }*/
        reject("Nothing found");
    }

      function fb_promise_then(result) {
        my_query.fields.brandFacebook=result;
        GM_addValueChangeListener("result",function() {
            console.log("FB result=",arguments[2]);
            let result=arguments[2];
            if(result.address) {
                console.log("address=",address);
                add_address(result.address);
            }
            if(result.email&&!my_query.fields.email) my_query.fields.email=result.email;
            if(result.url && !my_query.fields.website) my_query.fields.website=result.url;
            my_query.done.fb=true;
            submit_if_done();
        });
        GM_setValue("facebook",{"url":result,"date":Date.now()});

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function parse_gov_then() {
        if(Gov.email_list.length>0) {
            my_query.fields.email=Gov.email_list[0].email;
        }
        my_query.done.query=true;
        submit_if_done();
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.website=result;
        console.log("* query_promise_then,website=",my_query.fields.website);
        var query={dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/,/Director/]};
        var promise=MTP.create_promise(result,Gov.init_Gov,parse_gov_then,function() { GM_setValue("returnHit",true); },query);
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(x!="city" && x!="state" && x!="country" && !my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var url="https://www.expowest.com/en/exhibitors/exhibitor-list.html";
        var strong=document.querySelectorAll("crowd-form strong");
        console.log("strong=",strong);
        var name="",website="";
        for(i of strong) {
            if(/Company:/i.test(i.innerText)) {
                name=i.innerText.replace(/^\s*Company:\s*/i,"").trim();
                break;
            }
        }
        let last_one="";
        if(name==="") {
            for(i of strong) {
                if(/^www\./i.test(i.innerText)) {
                    website="https://"+i.innerText.trim();
                    name=last_one;
                    break;
                }
                last_one=i.innerText;
            }
        }
        my_query={name:name,
                  fields:{companyName:name,website:website,email:""},done:{query:false,hq:false,fb:false},
		  try_count:{"query":0,"hq":0},
		  submitted:false};
        my_query.short_name=my_query.name.replace(/[™®]/,"").replace(/\/.*$/,"");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        if(my_query.fields.website) {
            query_promise_then(my_query.fields.website);
        }
        else {
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });
        }
        const hqPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" headquarters", resolve, reject, query_response,"hq");
        });
        hqPromise.then(function() { my_query.done.hq=true; submit_if_done(); })
            .catch(function(val) {
            console.log("Failed at this hqPromise " + val); my_query.done.hq=true; submit_if_done(); });


        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning FB search");
            query_search(search_str+" site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val); my_query.done.fb=true; submit_if_done(); });
    }

})();