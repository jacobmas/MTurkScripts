// ==UserScript==
// @name         Jon HolmanRheumatologyOnly
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  small or medium/large medical
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
var bad_urls=['.beenverified.com', '.bizapedia.com', '.caredash.com', '//doctor.com', '.doctor.com', '.doctorhelps.com', '.doximity.com',
                  '.ehealthscores.com', '.endo-world.com', '.enpnetwork.com','/eyedoctor.io',
                  '.facebook.com', '.findagrave.com','findatopdoc.com', '.gastro.org', '.getluna.com',
                  'goodreads.com','.birdyeye.com',
                  '.healthcare4ppl.com', '.healthcare6.com','/unilocal.net',
                  '.healthgrades.com', '.healthpage.org', '/healthprovidersdata.com', '.healthsoul.com',
                  '.hipaaspace.com', '.imdb.com','.instantcheckmate.com', 'lawtally.com','/licensefiles.com',
                  '.linkedin.com', '.mapquest.com', '.md.com', '.medicalcare.com', '.medicareforall.com','.medicaredforall.com',
                  '.medicarelist.com', '.medicinenet.com', '.myheritage.com',
                  '.npidb.com', '/npidb.com', '/npidb.org', '/npino.com', '/npiprofile.com','/opennpi.org','orthopedic.io',
                  '.peoplefinders.com', 'www.primarycare-doctor.com', 'providers.hrt.org','.psychologytoday.com', '/pubprofile.com', '.sharecare.com',
                  '.spokeo.com', '.topnpi.com',"truepeoplesearch.com", '.usnews.com', '.vitadox.com', '.vitals.com', '.webmd.com', '.wellness.com',
                  '.whitepages.com',
                  '.wikipedia.org', '.yahoo.com','.yellowpages.com', '.yelp.com', '.zocdoc.com','.zoominfo.com'];

    bad_urls=bad_urls.concat(['.aad.org', 'affiliatejoin.com/','allpeople.com', '/biographymask.com', '.birdeye.com','.bizapedia.com','/bizstanding.com',
                              '.bbb.org','.chamberofcommerce.com',
                  '.caredash.com', 'castleconnolly.com', '.corporationwiki.com',
                  'dermatologistdiscover.com','.dnb.com','/dnb.com',
                  '.doctor.com', 'docspot.com','doctorsatlas.com',
                  '.doctorhelps.com', '.doximity.com', '.ehealthscores.com', '.everydayhealth.com','/ezdoctor.com',
                  '.fandom.com',
                  '/findadermatologist.com',
                  'findatopdoc.com', '.healthcare4ppl.com', 'healthcare4ppl.com',
                  '.healthcare6.com', '.healthgrades.com', '/healthprovidersdata.com', '.healthsoul.com','.imbd.com',
                  '.justdocsearch.com','licensefiles.com', '.linkedin.com','.logosdatabase.com',
                  '.manta.com','.md.com','.mdatl.com','magazine.com',
                  '.medicarelist.com', '.medicinenet.com', '.mturkcontent.com','.mylife.com', '.npidb.com','/npidb.org',
                  '/npino.com', '.npinumberlookup.org','/npiprofile.com',
                  '.okmedicalboard.org', 'opennpi.com',
                  '/opengovus.com','physiciansweekly.com','/pressrelease.healthcare','/pubprofile.com','/radaris.com','.ratemds.com',
                  '.sharecare.com','/site-stats.org','.spoke.com','.thoracic.org',
                  '.topnpi.com', '.usnews.com', '.vitadox.com', '.vitals.com', 'vivacare.com', '.webmd.com', '.wellness.com',
                  '.whodoyou.com','.wikipedia.org','.wsimg.com','.yahoo.com',
                  '.yellowpages.com', '.yelp.com', '.zocdoc.com','.zoominfo.com']);
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(50000,750+(Math.random()*1000),[],begin_script,"AHJ6Q0B967QOK",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));

				if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				}
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
					if(type==="query" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }

					}
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;

                 if(type==="healthgrades" && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                if(type==="webmd" && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
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
      /*  if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let search_str=my_query.name.replace(/\d.*$/,"");
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }*/
        reject("Nothing found");
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

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.url=result;
                console.log("query_promise_then,url=",my_query.url);
        my_query.done.query=true;
        //var promise=MTP.create_promise(my_query.url,parse_for_big,submit_if_done,function() { my_query.done.query=true; submit_if_done(); });

        submit_if_done();
    
    }

    function healthgrades_promise_then(result) {
        my_query.url=result;
                console.log("healthgrades_promise_then,url=",my_query.url);

        var promise=MTP.create_promise(my_query.url,parse_healthgrades,submit_if_done,function() { my_query.done.healthgrades=true; submit_if_done(); });
    }

    function check_specialties_only_rheumatology(specialty_list) {
        let found_rheumatology=false;
        let found_bad=false;
        let x;
        let okay_list=[/Internal Medicine/,/Nurse Practitioner/i,/Family Medicine/i,/Physician Assistant/i,/Emergency Medicine/i];
        for(x of specialty_list) {
            if(/Rheumatology/i.test(x)) found_rheumatology=true;
            else  {
                let matched_okay=false;
                let y;
                for(y of okay_list) {
                    if(y.test(x)) matched_okay=true;
                }
                if(!matched_okay) found_bad=false;
            }
        }
        console.log("found_rheumatology=",found_rheumatology,"found_bad=",found_bad);
        if(found_rheumatology && !found_bad) return true;
        return false;
    }

    function parse_healthgrades(doc,url,resolve,reject) {
        var specialties=doc.querySelector("[data-qa-target='office-practice-categories']");
        var specialty_list=[];
        if(specialties) {
            let text=specialties.innerText.replace(/\s*•.*$/,"").split(/,/);
            specialty_list=text;
        }
        else if((specialties=doc.querySelector("[data-qa-target='ProviderDisplaySpeciality']"))) {
            specialty_list=[specialties.innerText.trim()];
        }
        console.log("healthgrades: specialty_list=",specialty_list);
        let only_rheum=check_specialties_only_rheumatology(specialty_list);
        if(only_rheum&&!my_query.fields.classification) {
            my_query.fields.classification="Yes";
        }
        else if(!only_rheum) {
            my_query.fields.classification="No";
        }
        my_query.done.healthgrades=true;
        resolve("");
    }

    function webmd_promise_then(result) {
        my_query.url=result;
                console.log("webmd_promise_then,url=",my_query.url);

        var promise=MTP.create_promise(my_query.url,parse_webmd,submit_if_done,function() { my_query.done.webmd=true; submit_if_done(); });
    }

    function parse_webmd(doc,url,resolve,reject) {
        var desc=doc.querySelector("[itemprop='description']");
        var specialties=doc.querySelectorAll(".specialties-list li");
        var specialty_list=[];
        if(desc) {
            let descText=desc.innerText.trim();
            descText=descText.replace(/^.* specializes in /,"").replace(/ with \d.*$/,"").replace(/ and /g,",");
            console.log("descText=",descText);
            if(/is a group practice/.test(descText)) {

                my_query.done.webmd=true;

                resolve("");
                return;
            }
            let descSplit=descText.split(/,/);
            let x;
            for(x of descSplit) specialty_list.push(x);
        }
        if(specialties&&specialties.length>0) {
            console.log("found specialties");
            let x;
            for(x of specialties) specialty_list.push(x.innerText.trim());
        }
        if((specialties=doc.querySelectorAll(".prov-specialty-name")) && specialties.length>0) {
             console.log("found provider specialties");
            let x;
            for(x of specialties) specialty_list.push(x.innerText.trim());
        }
        console.log("specialty_list=",specialty_list);
        if(specialty_list.length>0) {
            let only_rheum=check_specialties_only_rheumatology(specialty_list);
            if(only_rheum&&!my_query.fields.classification) {
                my_query.fields.classification="Yes";
            }
            else if(!only_rheum) {
                my_query.fields.classification="No";
            }
        }
        my_query.done.webmd=true;
        resolve("");

    }


    var other_re_str="\\.eclinicalweb.com|\\.nextmd\\.com|www\\.myadventisthealthportal\\.org|\\.athenahealth\\.com|\\.followmyhealth\\.com|"+
        "\\.healow\\.com|\\.gobreeze.com|\\.ecwcloud\\.com|\\.myezyaccess\\.com|\\.myadsc\\.com";
    var other_re=new RegExp(other_re_str);
    console.log("other_re=",other_re);
 



    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=2000;
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


    console.log("other_re=",other_re);
    function parse_for_big(doc,url,resolve,reject) {
        console.log("parse_for_finddoctor,url=",url);
        let domain=MTP.get_domain_only(url,true);
        if(/\.(edu|gov)$/.test(domain)||domain==='ohiohealth.com') {
             my_query.fields.classification="No";
            my_query.done.query=true;
                resolve("");
                return;
        }
        var name=find_company_name_on_website(doc,url);
        if(name && / (System|Network)/.test(name)) {
            my_query.fields.classification="No";
            my_query.done.query=true;
                resolve("");
                return;
        }
        console.log('name=',name);
       // console.log("doc.links=",doc.links);
        let a=doc.querySelectorAll("a");
        //console.log("doc a querySelector=",a);
        //console.log("doc=",doc);
        var x;

        if(doc.links.length===0) {
                        console.log("No links, js-load");
            if(result.split('/').length>=6) {
                my_query.fields.classification="No";
                my_query.done.query=true;
                resolve("");
                return;
            }
            my_query.done.query=true;
                resolve("");
                return;

        }
        for(x of doc.links) {

            x.href=MTP.fix_remote_url(x.href,url);
                   // console.log("x.href=",x.href,"x.innerText=",x.innerText);

            if(!MTP.is_bad_url(x.href,bad_urls,-1) &&
               (/Find .*(Care|Doctor|Provider)/i.test(x.innerText)||/find[\/]{0,8}(doctor|provider)/.test(x.href))
              ||/^Leadership$/.test(x.innerText)
              ) {
                console.log("x.href=",x.href,"x.innerText=",x.innerText);
                my_query.fields.classification="No";
                my_query.done.query=true;
                resolve("");
                return;
            }
        }

        console.log("find doctor not found");
        my_query.done.query=true;
        resolve("");
    }

    function parse_for_big_then() {
        submit_if_done();
    }

    function find_company_name_on_website(doc,url) {
        var possible_name_list=[];
        var match=doc.body.innerText.match(/(Assistant|Associate)?(\s*Clinical)?\s*?Professor(\sof(\s[A-Z\&][a-z]*)+)?/);
        console.log("match=",match);
        //console.log(doc.body.innerText.match(/Professor.*/,""));
        if(match && my_query && my_query.fields) my_query.fields.Q4Url= match[0].trim();
         var site_name=doc.querySelector("meta[property='og:site_name']");
        if(site_name) {
                       possible_name_list.push({name:site_name.content.replace(/Website of\s*/i,""),priority:0});
                        }
        var logo=doc.querySelectorAll("img[id*='logo' i],img[src*='logo.' i],img[data-src*='logo.' i");
        var x,penalty_re=/Document|Blog/i,temp_cost=0;
        //var img=doc.querySelectorAll("img");
        //for(x of img) { console.log("img=",x,", outerHTML=",x.outerHTML); }
//        console.log("doc.querySelectorAll(img)=",doc.querySelectorAll("img"));

        for(x of logo) {
            if(x.alt) x.alt=x.alt.replace(/\slogo$/i,"").replace(/Website of\s*/i,"");
            if(x.alt && /^[A-Z]/.test(x.alt) && !/Logo|(^\s*(Footer|Home)\s*)/i.test(x.alt)) {
                temp_cost=penalty_re.test(x.alt)?10:0;
                possible_name_list.push({name:x.alt,priority:3+temp_cost});

            }
        }
        if(logo.length===0) logo=doc.querySelectorAll("img[id*='logo' i],img[src*='logo' i],img[data-src*='logo' i");
        for(x of logo) {
            if(x.alt) x.alt=x.alt.replace(/\slogo$/i,"").replace(/Website of\s*/i,"");;
            if(x.alt && /^[A-Z]/.test(x.alt) && !/Form|Logo|(^\s*Home\s*)/i.test(x.alt)) {
                                temp_cost=penalty_re.test(x.alt)?10:0;

                possible_name_list.push({name:x.alt,priority:6+temp_cost});

            }
        }
        var footer = doc.querySelector("footer");
        var new_copyright_match;
        if(footer) {
            var copyright_re=/© \d+ ([^\.\,\|]{3,50})/;
            new_copyright_match=footer.innerText.match(copyright_re);
            console.log("new_copyright_match=",new_copyright_match);
        }
        var copyright_list=MTP.company_from_copyright(doc,url);
        console.log("copyright_list=",copyright_list);
        for(x of copyright_list) {
            if(copyright_list.length>0&&!/Copyright|document/i.test(copyright_list[0])) {
                possible_name_list.push({name:x.replace(/\s{2,}.*$/,""),priority:10});
                // return copyright_list[0].replace(/\s{2,}.*$/,"");

            }
        }
        possible_name_list.sort(function(el1, el2) { return el1.priority-el2.priority; });

        console.log("possible_name_list=",possible_name_list);
        if(possible_name_list.length>0) return possible_name_list[0].name;
        if(new_copyright_match&&new_copyright_match.length>1) return new_copyright_match[1].trim()
        return "";//possible_name_list;

    }

    function add_to_sheet() {
        var x,fields;
        var item=document.querySelector("crowd-classifier").shadowRoot;
        fields=item.querySelectorAll("button.category-button")
        console.log("fields=",fields);
        if(my_query.fields.classification==="Yes") {
            fields[0].click();
        }
        else if(my_query.fields.classification==="No") {
            fields[1].click();

        }

    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
             var item=document.querySelector("crowd-classifier").shadowRoot;
        let mybutton=item.querySelector("button[type='submit']");
            console.log("Submitting");
            if(GM_getValue("automate")) {
               setTimeout(function() { mybutton.click(); }, 750+(Math.random()*1000)); }
        }
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

        var target=document.querySelectorAll("form div p")[1];
        console.log(target.innerText);
        my_query={full_name:target.innerText.trim(),fields:{classification:""},done:{query:false,healthgrades:false,webmd:false},
		  try_count:{"query":0,"healthgrades":0,"webmd":0},
		  submitted:false};
        my_query.name=my_query.full_name.replace(/\s[\(\d].*$/,"");



        if(/(Oncology|Psychiatric|Pharmacy|Midwifery|Hematology|Cardiology|Pain Management|Pain Therapy|Radiolgy|Radiology|Cardiac)([\/ ]|$)/.test(my_query.name)) {
            my_query.fields.classification="No";
            my_query.done.query=my_query.done.healthgrades=my_query.done.webmd=true;
            submit_if_done();
            return;
        }

        if(/(Rheumatology|Arthritis|Rheumatologist)([\/ ]|$)/.test(my_query.name)) {
            my_query.fields.classification="Yes";
            my_query.done.query=my_query.done.healthgrades=my_query.done.webmd=true;
            submit_if_done();
            return;
        }

	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.full_name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });
        const healthgradesPromise = new Promise((resolve, reject) => {
            console.log("Beginning healthgrades search");
            query_search(search_str+" site:healthgrades.com", resolve, reject, query_response,"healthgrades");
        });
        healthgradesPromise.then(healthgrades_promise_then)
            .catch(function(val) {
            console.log("Failed at this healthgradesPromise " + val); my_query.done.healthgrades=true;  submit_if_done() });
        const webmdPromise = new Promise((resolve, reject) => {
            console.log("Beginning webmd search");
            query_search(search_str+" site:webmd.com", resolve, reject, query_response,"webmd");
        });
        webmdPromise.then(webmd_promise_then)
            .catch(function(val) {
            console.log("Failed at this webmdPromise " + val); my_query.done.webmd=true;  submit_if_done() });
    }

})();