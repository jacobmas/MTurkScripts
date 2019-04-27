// ==UserScript==
// @name         SWAddress
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var country_list={"AF":"Afghanistan","AX":"\u00c5land Islands","AL":"Albania","DZ":"Algeria","AS":"American Samoa","AD":"Andorra","AO":"Angola","AI":"Anguilla","AQ":"Antarctica","AG":"Antigua and Barbuda","AR":"Argentina","AM":"Armenia","AW":"Aruba","AU":"Australia","AT":"Austria","AZ":"Azerbaijan","BS":"Bahamas","BH":"Bahrain","BD":"Bangladesh","BB":"Barbados","BY":"Belarus","BE":"Belgium","BZ":"Belize","BJ":"Benin","BM":"Bermuda","BT":"Bhutan","BO":"Bolivia, Plurinational State of","BQ":"Bonaire, Sint Eustatius and Saba","BA":"Bosnia and Herzegovina","BW":"Botswana","BV":"Bouvet Island","BR":"Brazil","IO":"British Indian Ocean Territory","BN":"Brunei Darussalam","BG":"Bulgaria","BF":"Burkina Faso","BI":"Burundi","KH":"Cambodia","CM":"Cameroon","CA":"Canada","CV":"Cape Verde","KY":"Cayman Islands","CF":"Central African Republic","TD":"Chad","CL":"Chile","CN":"China","CX":"Christmas Island","CC":"Cocos (Keeling) Islands","CO":"Colombia","KM":"Comoros","CG":"Congo","CD":"Congo, the Democratic Republic of the","CK":"Cook Islands","CR":"Costa Rica","CI":"C\u00f4te d'Ivoire","HR":"Croatia","CU":"Cuba","CW":"Cura\u00e7ao","CY":"Cyprus","CZ":"Czech Republic","DK":"Denmark","DJ":"Djibouti","DM":"Dominica","DO":"Dominican Republic","EC":"Ecuador","EG":"Egypt","SV":"El Salvador","GQ":"Equatorial Guinea","ER":"Eritrea","EE":"Estonia","ET":"Ethiopia","FK":"Falkland Islands (Malvinas)","FO":"Faroe Islands","FJ":"Fiji","FI":"Finland","FR":"France","GF":"French Guiana","PF":"French Polynesia","TF":"French Southern Territories","GA":"Gabon","GM":"Gambia","GE":"Georgia","DE":"Germany","GH":"Ghana","GI":"Gibraltar","GR":"Greece","GL":"Greenland","GD":"Grenada","GP":"Guadeloupe","GU":"Guam","GT":"Guatemala","GG":"Guernsey","GN":"Guinea","GW":"Guinea-Bissau","GY":"Guyana","HT":"Haiti","HM":"Heard Island and McDonald Islands","VA":"Holy See (Vatican City State)","HN":"Honduras","HK":"Hong Kong","HU":"Hungary","IS":"Iceland","IN":"India","ID":"Indonesia","IR":"Iran, Islamic Republic of","IQ":"Iraq","IE":"Ireland","IM":"Isle of Man","IL":"Israel","IT":"Italy","JM":"Jamaica","JP":"Japan","JE":"Jersey","JO":"Jordan","KZ":"Kazakhstan","KE":"Kenya","KI":"Kiribati","KP":"Korea, Democratic People's Republic of","KR":"Korea, Republic of","KW":"Kuwait","KG":"Kyrgyzstan","LA":"Lao People's Democratic Republic","LV":"Latvia","LB":"Lebanon","LS":"Lesotho","LR":"Liberia","LY":"Libya","LI":"Liechtenstein","LT":"Lithuania","LU":"Luxembourg","MO":"Macao","MK":"Macedonia, the Former Yugoslav Republic of","MG":"Madagascar","MW":"Malawi","MY":"Malaysia","MV":"Maldives","ML":"Mali","MT":"Malta","MH":"Marshall Islands","MQ":"Martinique","MR":"Mauritania","MU":"Mauritius","YT":"Mayotte","MX":"Mexico","FM":"Micronesia, Federated States of","MD":"Moldova, Republic of","MC":"Monaco","MN":"Mongolia","ME":"Montenegro","MS":"Montserrat","MA":"Morocco","MZ":"Mozambique","MM":"Myanmar","NA":"Namibia","NR":"Nauru","NP":"Nepal","NL":"Netherlands","NC":"New Caledonia","NZ":"New Zealand","NI":"Nicaragua","NE":"Niger","NG":"Nigeria","NU":"Niue","NF":"Norfolk Island","MP":"Northern Mariana Islands","NO":"Norway","OM":"Oman","PK":"Pakistan","PW":"Palau","PS":"Palestine, State of","PA":"Panama","PG":"Papua New Guinea","PY":"Paraguay","PE":"Peru","PH":"Philippines","PN":"Pitcairn","PL":"Poland","PT":"Portugal","PR":"Puerto Rico","QA":"Qatar","RE":"R\u00e9union","RO":"Romania","RU":"Russian Federation","RW":"Rwanda","BL":"Saint Barth\u00e9lemy","SH":"Saint Helena, Ascension and Tristan da Cunha","KN":"Saint Kitts and Nevis","LC":"Saint Lucia","MF":"Saint Martin (French part)","PM":"Saint Pierre and Miquelon","VC":"Saint Vincent and the Grenadines","WS":"Samoa","SM":"San Marino","ST":"Sao Tome and Principe","SA":"Saudi Arabia","SN":"Senegal","RS":"Serbia","SC":"Seychelles","SL":"Sierra Leone","SG":"Singapore","SX":"Sint Maarten (Dutch part)","SK":"Slovakia","SI":"Slovenia","SB":"Solomon Islands","SO":"Somalia","ZA":"South Africa","GS":"South Georgia and the South Sandwich Islands","SS":"South Sudan","ES":"Spain","LK":"Sri Lanka","SD":"Sudan","SR":"Suriname","SJ":"Svalbard and Jan Mayen","SZ":"Swaziland","SE":"Sweden","CH":"Switzerland","SY":"Syrian Arab Republic","TW":"Taiwan, Province of China","TJ":"Tajikistan","TZ":"Tanzania, United Republic of","TH":"Thailand","TL":"Timor-Leste","TG":"Togo","TK":"Tokelau","TO":"Tonga","TT":"Trinidad and Tobago","TN":"Tunisia","TR":"Turkey","TM":"Turkmenistan","TC":"Turks and Caicos Islands","TV":"Tuvalu","UG":"Uganda","UA":"Ukraine","AE":"United Arab Emirates","GB":"United Kingdom","US":"United States","UM":"United States Minor Outlying Islands","UY":"Uruguay","UZ":"Uzbekistan","VU":"Vanuatu","VE":"Venezuela, Bolivarian Republic of","VN":"Viet Nam","VG":"Virgin Islands, British","VI":"Virgin Islands, U.S.","WF":"Wallis and Futuna","EH":"Western Sahara","YE":"Yemen","ZM":"Zambia","ZW":"Zimbabwe"};
    var MTurk=new MTurkScript(40000,200,[],begin_script,"AM36LIU60S59C",false);
    var MTP=MTurkScript.prototype;
    var address_term_map={"address1":"addressLine1","address2":"addressLine2","city":"city","state":"stateOrRegion","postcode":"zip"};
    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        console.log("is_bad_name,lower_b="+lower_b);

        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
    

        if(MTP.matches_names(b_name,my_query.name)) return false;

       // if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            if(parsed_context.Address) { Address.addressList.push(new Address(parsed_context.Address,2)); }
            if(parsed_context.Phone) { Address.phoneList.push({phone:parsed_context.Phone,priority:2}); }


                console.log("parsed_context="+JSON.stringify(parsed_context));

        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(parsed_lgb.address) { Address.addressList.push(new Address(parsed_lgb.address,2)); }
                if(parsed_lgb.phone) { Address.phoneList.push({phone:parsed_lgb.phone,priority:2}); }

                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="fb" && !MTP.is_bad_fb(b_url,b_name) && !is_bad_name(MTP.removeDiacritics(b_name),p_caption,i) && (b1_success=true)) break;
                if(type==="yp" && !is_bad_name(MTP.removeDiacritics(b_name),p_caption,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(/^fb$/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" site:facebook.com", resolve, reject, query_response,"fb");
            return;
        }
        if(/^query$/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+"", resolve, reject, query_response,"fb");
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.done.query=true;
        submit_if_done();
    }

    function yp_promise_then(result) {
        my_query.yp_url=result;
        var promise=MTP.create_promise(result,MTP.parse_yellowpages,parse_yp_then,function() {
            console.log("FAiled yp");
            my_query.done.yp=true; submit_if_done(); });
    }
    function parse_yp_then(result) {
        var x;
        if(result.success &&result.address)
        {
            var add=new Address(result.address);
            if(add.priority<10000) Address.addressList.push(add);
        }
        if(result.phone) Address.phoneList.push({phone:result.phone,priority:1.5});
        my_query.done.yp=true;
        submit_if_done();
    }

    function fb_promise_then(result) {
        var url=result.replace(/m\./,"www.").
        replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then,function() {
            console.log("Failed at facebook"); my_query.done.fb=true; submit_if_done(); });
    }
    function add_query_promise_then() {
        console.log("Done add_query");
        my_query.done.address_query=true;
        submit_if_done();
    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.phone) Address.phoneList.push({phone:result.phone,priority:1.5});
        if(result.address) {
            my_query.done.address_query=false;
            const add_queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(result.pageTitle+" "+result.address, resolve, reject, query_response,"add_query");
            });
            add_queryPromise.then(add_query_promise_then)
                .catch(function(val) {
                console.log("Failed at this add_queryPromise " + val);
                my_query.done.address_query=true;
                submit_if_done();
            });
            //136 Diamond St,Philadelphia, Pennsylvania

        }
        my_query.done.fb=true;
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined&&Address!==undefined) { callback(); }
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
        var good_add,good_phone;
        Address.addressList.sort(Address.cmp);
        console.log("Address.addressList="+JSON.stringify(Address.addressList));
        Address.phoneList.sort(function(p1,p2) { return p2.priority-p1.priority; });
        if(Address.addressList.length>0 && Address.phoneList.length>0) {
            good_add=Address.addressList[0];
            good_phone=Address.phoneList[0];
            console.log("good_add="+JSON.stringify(good_add));
            console.log("phoneList="+JSON.stringify(Address.phoneList));
            for(x in address_term_map) {
                if(good_add[x]) my_query.fields[address_term_map[x]]=good_add[x];
            }
            for(x in country_list) {
                if(good_add.country && good_add.country===country_list[x]) my_query.fields.country=x;
            }
            my_query.fields.phone=good_phone.phone.trim();

        }
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        if((!my_query.fields.addressLine1&&!my_query.fields.addressLine2)  ||!my_query.fields.phone) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find, returning");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }

    }

    function scrape_address_then(result) {
        var good_add,good_phone,x;
        my_query.done.url=true;
        console.log("Finished url scraping!");
        submit_if_done();

    }
    function scrape_address_catch(result) {
        my_query.done.url=true;
        console.log("Failed at query "+result);
        submit_if_done();
//        GM_setValue("returnHit"+MTurk.assignment_id,true);
    }
    var paste_address=function(e,obj,field_map,callback) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        console.log("address text="+text);
        var add=new Address(text,-50),x;
        add.country="US";
        for(x in address_term_map) if(add[x]!==undefined) my_query.fields[address_term_map[x]]=add[x];
        add_to_sheet();
    };


    function init_Query()
    {
        console.log("in init_query");
        var i;
        var p=document.querySelectorAll("form p"),match;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.querySelector(".dont-break-out");
        my_query={name,url:dont.href,fields:{},done:{url:false,query:false,fb:false,yp:false},submitted:false,try_count:{fb:0,query:0}};
        for(i=0;i<p.length;i++) {
            if((match=p[i].innerText.match(/Company Name:\s*(.*)$/))) { my_query.name=match[1].trim(); }
        }

	console.log("my_query="+JSON.stringify(my_query));
        var promise=MTP.create_promise(my_query.url,Address.scrape_address,scrape_address_then,scrape_address_catch,{depth:0,type:""});
        document.querySelector("#addressLine1").addEventListener("paste",paste_address);

        var search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" address", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.query=true;
            submit_if_done();
        });
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search("\""+search_str+"\" site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val);
            my_query.done.fb=true;
            submit_if_done();
        });
        const ypPromise = new Promise((resolve, reject) => {
            console.log("Beginning yellowpages search");
            query_search(search_str+" site:yellowpages.com", resolve, reject, query_response,"yp");
        });
        ypPromise.then(yp_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.yp=true;
            submit_if_done();
        });
    }

})();