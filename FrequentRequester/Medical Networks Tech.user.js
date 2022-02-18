// ==UserScript==
// @name         Medical Networks Tech
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Varsha also TODO: update for non-dermatology/pulmonology if necessary!
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
    var bad_urls=['.aad.org', 'affiliatejoin.com/','allpeople.com', '/biographymask.com', '.birdeye.com','.bizapedia.com','/bizstanding.com',
                  '.caredash.com', 'castleconnolly.com', '.corporationwiki.com',
                  'dermatologistdiscover.com',
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
                  '.okmedicalboard.org',
                  '/opengovus.com','physiciansweekly.com','/pressrelease.healthcare','/pubprofile.com','/radaris.com','.ratemds.com',
                  '.sharecare.com','/site-stats.org','.spoke.com','.thoracic.org',
                  '.topnpi.com', '.usnews.com', '.vitadox.com', '.vitals.com', 'vivacare.com', '.webmd.com', '.wellness.com',
                  '.whodoyou.com','.wikipedia.org','.wsimg.com','.yahoo.com',
                  '.yellowpages.com', '.yelp.com', '.zocdoc.com','.zoominfo.com'];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,500+(Math.random()*1000),[],begin_script,"A368JNAWVCNUOW",false);
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
        var healthgrades_url="";
        try
        {
            search=doc.getElementById("b_content");
            console.log("search=",search);
            b_algo=search.getElementsByClassName("b_algo");
            b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");

            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("NLOP");
                if(type==="query" && parsed_context.Address) {
                    my_query.address=new Address(parsed_context.Address);
                }
                if(type==="query2" && parsed_context.Title && !/^Dermatology$/.test(parsed_context.Title)) {
                    my_query.fields['Q2Url']=parsed_context.Title.replace(/✕.*$/,"");
                    resolve("");
                    return;
                }
                else if(type==="query2" && parsed_context.people!==undefined && parsed_context.people[0].url && my_query.try_count[type]===0) {

                    my_query.try_count[type]++;
                    GM_xmlhttpRequest({method: 'GET', url: parsed_context.people[0].url,
                           onload: function(response) {query_response(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
                                        return;
                }
                 else if(type==="query" && my_query.try_count[type]===0 && parsed_context.people!==undefined && parsed_context.people[0].url && my_query.try_count[type]===0) {

                    my_query.try_count[type]++;
                    GM_xmlhttpRequest({method: 'GET', url: parsed_context.people[0].url,
                           onload: function(response) {query_response(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
                                        return;
                }
                if(type==='query'&& my_query.try_count[type]===0 && parsed_context.thing!==undefined&&parsed_context.thing.Clinic!==undefined) {
                    my_query.fields['Q2Url']=parsed_context.thing.Clinic;
                    query_search(my_query.short_name+" "+parsed_context.thing.Clinic+" ", resolve, reject, query_response,"clinic_query");
                    return;
                }
                else if(type==='query' && my_query.try_count[type]===0 &&parsed_context.SubTitle==='Rheumatologist') {
                    my_query.fields['Q2Url']=parsed_context.Title;
                    query_search(my_query.short_name+" "+parsed_context.Title+" ", resolve, reject, query_response,"clinic_query");
                    return;
                }
                
                if(type==="query" &&  my_query.try_count[type]===0  && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                    my_query.temp_url=parsed_context.url;
                }

                console.log("parsed_context="+JSON.stringify(parsed_context));
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));

            if(type==="query" && parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,-1) && !my_query.temp_url) {
                    my_query.temp_url=parsed_lgb.url;
                }
            }
            //console.log("here, b_algo=",b_algo);
            for(i=0; i < b_algo.length; i++) {
                if(type==="healthgrades" && i>=1) break;
              //  console.log("b_algo["+i+"]=",b_algo[i]);
                b_name=(b_algo[i].querySelector("h2 a")?b_algo[i].querySelector("h2 a").textContent:b_algo[i].getElementsByTagName("a")[0].textContent);
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].querySelector(".b_caption p");
                //console.log("b_caption=",b_caption);
                p_caption=(b_caption?b_caption.innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():""));
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && i < 5 &&
                   (!MTurkScript.prototype.is_bad_name(b_name,my_query.short_name,p_caption,i) ||
                    (((new RegExp(my_query.parsed_name.fname.substr(0,1)).test(b_name)&&i<2)||new RegExp(my_query.parsed_name.fname).test(b_name))
                     && new RegExp(my_query.parsed_name.lname,"i").test(b_name))||((new RegExp("Dr. "+my_query.parsed_name.lname,"i").test(p_caption)))
                   ||(new RegExp(my_query.parsed_name.fname,"i").test(p_caption) && new RegExp(my_query.parsed_name.lname,"i").test(p_caption))
                   )
		   && (b1_success=true)) {
                    console.log("SUCCESSS");
                    if(/Pediatric Dermatology/i.test(p_caption)) my_query.fields.Q3Url="Pediatric Dermatology";
                    else if(/Mohs\s/.test(p_caption)) my_query.fields.Q3Url="Mohs Surgery";
                    else if(/Cosmetic|Plastic/i.test(p_caption)) my_query.fields.Q3Url="Plastic Surgery";
                    else if(/Dermatopathology|dermatopathologist/i.test(p_caption)) my_query.fields.Q3Url="Dermatopathology";
                    else if(/Surgical Dermatology/i.test(p_caption)) my_query.fields.Q3Url="Surgical Dermatology";
                    else if(/Critical Care/i.test(p_caption)) my_query.fields.Q3Url="Critical Care";
                    else if(/Pediatric/i.test(p_caption)) my_query.fields.Q3Url="Pediatric";

                    break;
                }
                if(/healthgrades\.com\//.test(b_url) && !my_query.healthgrades_url) {
                    my_query.healthgrades_url=healthgrades_url=b_url;
                    console.log("my_query.healthgrades_url=",my_query.healthgrades_url); }
            }
            if(b1_success && (resolve({url:b_url,name:b_name,caption:p_caption})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="query" && !(my_query.address&&!my_query.temp_url)) {
            if(type==="query" && my_query.temp_url) {
                var promise=MTP.create_promise(my_query.temp_url,find_staff_page,resolve,reject);
                return;
            }
            if((type == "query" ||type==="healthgrades") && healthgrades_url) {
                let promise=MTP.create_promise(healthgrades_url,check_age_healthgrades,submit_if_done, function() { GM_setValue("returnHit",true); });
                return;
            }
            if(type ==="query" && parsed_context && parsed_context.closed) {
                my_query.fields.Q3Url="";
                my_query.fields.Q4Url="Retired";
                submit_if_done();
                return;
            }
        }
        if(type==="healthgrades" && healthgrades_url) {
            resolve(healthgrades_url); return;
        }


	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        console.log("** do_next_query, type=",type);
        if(type==="query" && my_query.try_count[type]===0 && my_query.address) {
            my_query.try_count[type]++;
             query_search(my_query.name+" "+my_query.address.state, resolve, reject, query_response,"query");
            return;
        }
        if(type==="query2" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search("\""+my_query.domain+"\" name", resolve, reject, query_response,"query2");
            return;
        }
        if(type==="query2" && my_query.try_count[type]>0) {
            var promise=MTP.create_promise(my_query.fields.Q1Url,parse_website,resolve,reject);
            return;
        }
        reject("Nothing found");
    }

    function check_age_healthgrades(doc,url,resolve,reject) {
        console.log("url=",url);
        var span=doc.querySelector("span[data-qa-target='ProviderDisplayAge']");
        if(span) { console.log("span=",span);
                  var age=parseInt(span.innerText.replace(/[^\d]+/g,""));
                  if(age>=67) {
                      my_query.fields.Q3Url="";
                      my_query.fields.Q4Url="Retired, "+age+" years old";
                      resolve("");
                      return;
                  }
                 }

        reject();
    }

    function find_staff_page(doc,url,resolve,reject) {
        console.log("find_staff_page,url=",url);
        var links;
        var x;
        var secondary_url="";
         var name_regex=new RegExp(my_query.parsed_name.fname+"\\s+([^\\s]+\\s){0,2}"+my_query.parsed_name.lname,"i");
        console.log("name_regex=",name_regex);
        if(name_regex.test(doc.body.innerText)) {
            resolve({url:url});
            return;
        }
        var staff_re=/^(Staff|Team|Physicians|Doctors|Providers|Our Providers|Our Team|Our Doctors|Our Physicians|Our Staff)(\s*|$)/i;
        for(x of doc.links) {
            x.href=MTP.fix_remote_url(x.href,url);
                console.log("x=",x.href,", x.innerText=",x.innerText);
            if(staff_re.test(x.innerText.trim())) {
                console.log("x=",x.href,", x.innerText=",x.innerText);

               var promise=MTP.create_promise(x.href,verify_staff_page,resolve,reject);
                return;
            }
            else if(/^About(\s|$)/.test(x.innerText.trim())) secondary_url=x.href;
        }
        if(secondary_url) {

            let promise=MTP.create_promise(secondary_url,verify_staff_page,resolve,reject);
                return;
        }
        if(my_query.healthgrades_url) {
         let promise=MTP.create_promise(my_query.healthgrades_url,check_age_healthgrades,submit_if_done, reject);
return;
        }
        reject({});


    }

    function hg_promise_then(result) {
        console.log("result=",result);
        let promise=MTP.create_promise(result,check_age_healthgrades,submit_if_done, function() { GM_setValue("returnHit",true); });
                return;
    }

    function verify_staff_page(doc,url,resolve,reject) {
                console.log("verify_staff_page,url=",url);
        var name_regex=new RegExp(my_query.parsed_name.fname+"\\s+([^\\s]+\\s){0,2}"+my_query.parsed_name.lname,"i");
        console.log("name_regex=",name_regex);
        if(name_regex.test(doc.body.innerText)) {
            resolve({url:url});
            return;
        }
        console.log("my_query=",my_query);
         if(my_query.healthgrades_url) {
             console.log("checking healthgrades");
             let promise=MTP.create_promise(my_query.healthgrades_url,check_age_healthgrades,submit_if_done, reject);
             return;
        }
        reject("");

    }

    function find_company_name_on_website(doc,url) {
        console.log("Finding company name on ",url);
        var possible_name_list=[];
        var match=doc.body.innerText.match(/(Assistant|Associate)?(\s*Clinical)?\s*?Professor(\sof(\s[A-Z\&][a-z]*)+)?/);
        console.log("match=",match);
        //console.log(doc.body.innerText.match(/Professor.*/,""));
        if(match && my_query && my_query.fields) my_query.fields.Q4Url= match[0].trim();
         var site_name=doc.querySelector("meta[property='og:site_name']");
        if(site_name) { console.log("Found site name=",site_name.content);
                       possible_name_list.push({name:site_name.content.replace(/Website of\s*/i,""),priority:0});
                        }
        var logo=doc.querySelectorAll("img[id*='logo' i],img[src*='logo.' i],img[data-src*='logo.' i");
        var x,penalty_re=/Document|Blog/i,temp_cost=0;
        //var img=doc.querySelectorAll("img");
        //for(x of img) { console.log("img=",x,", outerHTML=",x.outerHTML); }
//        console.log("doc.querySelectorAll(img)=",doc.querySelectorAll("img"));
        console.log("logo=",logo);

        for(x of logo) {
            console.log("x=",x);
            if(x.alt) x.alt=x.alt.replace(/\slogo$/i,"").replace(/Website of\s*/i,"");
            if(x.alt && /^[A-Z]/.test(x.alt) && !/Logo|(^\s*(Footer|Home)\s*)/i.test(x.alt)) {
                console.log("Found logo alt=",x.alt);
                temp_cost=penalty_re.test(x.alt)?10:0;
                possible_name_list.push({name:x.alt,priority:3+temp_cost});
              
            }
        }
        if(logo.length===0) logo=doc.querySelectorAll("img[id*='logo' i],img[src*='logo' i],img[data-src*='logo' i");
        for(x of logo) {
            console.log("x=",x);
            if(x.alt) x.alt=x.alt.replace(/\slogo$/i,"").replace(/Website of\s*/i,"");;
            if(x.alt && /^[A-Z]/.test(x.alt) && !/Form|Logo|(^\s*Home\s*)/i.test(x.alt)) {
                console.log("Found logo alt=",x.alt);
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

    function parse_website(doc,url,resolve,reject) {
        my_query.parsed_website=true;
        var result=find_company_name_on_website(doc,url);
        if(/^Department /.test(result)) result="";
        if(result && !my_query.fields.Q2Url) my_query.fields.Q2Url=result;
        if(my_query.fields.Q2Url) { resolve(""); return; }
        reject("");
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
        my_query.fields.Q1Url=result.url;
        console.log("result=",result);
        my_query.done.query=true;
       // https://www.medicalofficesofmanhattan.com
        var modified_url=result.url.replace(/(https?:\/\/[^\/]*).*$/,"$1").replace(/(https?:\/\/)([^\.]+)(\.[^\.\/]+\.[^\/]+)/,"$1www$3");

        modified_url=MTP.get_domain_only(modified_url);
        my_query.domain=modified_url;
        console.log("modified_url=",modified_url);

         const queryPromise2 = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
              query_search("\""+modified_url+"\"", resolve, reject, query_response,"query2");
        });
        queryPromise2.then(query_promise_then2)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
      
    }
     function query_promise_then2(result) {
         if(!my_query.parsed_website) {
             var promise=MTP.create_promise(my_query.fields.Q1Url,parse_website,submit_if_done,submit_if_done);
             return;
         }
         submit_if_done();
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var p=document.querySelectorAll("form p");
        var colon_re=/^[^:]*:\s*/;
        my_query={name:p[0].innerText.trim().replace(colon_re,''),parsed_website:false,
                  specialty:p[1].innerText.trim().replace(colon_re,''),
                  
                  fields:{Q1Url:'',Q2Url:'',Q3Url:''},done:{},
		  try_count:{"query":0,"query2":0},
		  submitted:false};
        my_query.short_name=my_query.name.replace(/,.*$/,"");
        my_query.parsed_name=MTP.parse_name(my_query.short_name);
        my_query.fields.Q3Url=my_query.specialty;
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.short_name+" "+my_query.specialty+" ";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.short_name+" "+my_query.specialty+" ", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            if(!my_query.healthgrades_url) {
                const hgPromise = new Promise((resolve, reject) => {
                    console.log("Beginning healthgrades search");
                    query_search(my_query.short_name+" "+my_query.specialty+" site:healthgrades.com", resolve, reject, query_response,"healthgrades");
                });
                hgPromise.then(hg_promise_then)
                    .catch(function(val) {
                    console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            }
            else {
                GM_setValue("returnHit",true);
            }

        });
    }

})();