// ==UserScript==
// @name         DoctorDB
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
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
    var bad_schemas=["SiteNavigationElement","WebSite","WebPage","WPHeader","WPFooter","ImageGallery","Rating","Review",
                     "AggregateRating","VideoObject","ImageObject"];
    var bad_urls=['.addresses.com','/allpeople.com','.allstate.com','.amazon.com','.ancestry.com', '.ancientfaces.com','.angmedicare.com','angi.com','/arrestfacts.com','.arounddeal.com',
                  '.avvo.com','.bbb.org',
                  '.beenverified.com', 'ballotpedia.','.bettergov.org',
                  'birthindex.org',
                  '.bizapedia.com', '/boxclue.co','.brandyourself.com','.caredash.com',
                  '.castleconnolly.com','.celebsagewiki.com','/checkpeople.com',
                  'clustrmaps.com','companyregistry.com','.crunchbase.com','/dataveria.com',
                  '.dentalplans.com','www.dfes.com', '.diabetesiq.com','.dignitymemorial.com',
                  '.dnb.com','.docbios.com','/docspot.com','.docspot.com',
                  '//doctor.com', '.doctor.com', '.doctorhelps.com', '.doximity.com',
                  '.echovita.com','.ecyberclinics.com',
                  '.ehealthscores.com', '.endo-world.com', '.enpnetwork.com','/eyedoctor.io',
                  '.facebook.com', '.familysearch.org','.federalpay.org','.fertilityiq.com', '.findagrave.com',
                  'www.findmugshots.com',
                  'findatopdoc.com',
                  '.gastro.org', '.getluna.com',
                  'goodreads.com','/govsalaries.com',
                  '/healow.com','.healthcare4ppl.com', '.healthcare6.com',
                  '.healthgrades.com', '.healthline.com','.healthpage.org', '/healthprovidersdata.com', '.healthsoul.com',
                  '.healthlynked.com','.hipaaspace.com','.hometownlocator.com',
                  '.imdb.com','/inforver.com','.instantcheckmate.com', '.kellysearch.com','/lawandcrime.com',
                  'lawgroup.com','lawtally.com','.legacy.com',
                  '/licensefiles.com',
                  '.linkedin.com', '.localdoc.com','.locatepeople.org','/marriedwiki.com',
                  '.mapquest.com', '.md.com', '.mdnpi.com', '.medicalcare.com','.medicalnewstoday.com', '.medicareforall.com','.medicaredforall.com',
                  '.medicarelist.com', '.medicinenet.com', '.morganstanley.com',
                  '.myheritage.com','.mylife.com',
                  '.mturkcontent.com','/muckrack.com','/nicelocal.com',
                  '/npi-lookup.org',
                  '.npidb.com', '/npidb.com', '/npidb.org', '/npino.com', '.npinumberlookup', '/npiprofile.com',
                  '/nuwber.com', '//obits./', '.officialusa.com','/olympics.com','/opencorporates.com', '/opengovus.com',
                  '/opennpi.com',"/openthedata.com",
                  '/opennpi.org','orthopedic.io','.peekyou.com',
                  '.peoplefinders.com', 'www.primarycare-doctor.com', '.placedigger.com', 'providers.hrt.org','.psychologytoday.com', '/pubprofile.com',
                  '/publicdatadigger.com',
                  '.ratemyprofessors.com',
                  '.realself.com','residentdatabase.com', '.researchgate.net','.reunion.com','rocketreach.co',
                  '.sharecare.com','.signalhire.com',
                  '.spokeo.com', 'statefarm.com', '.ted.com','.topionetworks.com','.topnpi.com','trademarking.in',
                  ".tributearchive.com",
                  "truepeoplesearch.com", '/trulista.com','/trustifo.com','/unicourt.com',
                  '.usnews.com', '.vitadox.com', '/vitals.com','.vitals.com',
                  '/voterrecords.com',
                  '.webmd.com', '.wellness.com',
                  '.whitepages.com','/wikibious.com',
                  '.wikipedia.org', '.yahoo.com','.yellowpages.com', 'www.yellowpages', '.yelp.com','.yelp.ca','.youtube.com',
                  '.zillow.com', '.zocdoc.com','.zoominfo.com']
    var MTurk=new MTurkScript(30000,1000,[],begin_script,"A1BOHRKGTWLMTJ",true);
    var MTP=MTurkScript.prototype;
    var add_map={"address1":"address1","address2":"address2","city":"city","state":"state","postcode":"zip"};

    function is_bad_name(b_name, p_caption) {
        if(/Funeral/i.test(p_caption) || /Funeral|Attorney License|Real Estate| Agent|Law Firm| Law$| Advisor/i.test(b_name)) return true;
        if(/ LLP\s*$/.test(b_name)) return true;

        return false;
    }

    function is_bad_context(parsed_context) {
        if(/real-estate/.test(parsed_context.url)) return true;
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

                if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1) && !is_bad_context(parsed_context)) {
                    parsed_context.url=parsed_context.url.replace(/https?:\/\/www\.www\./,"https://www.");
                    resolve(parsed_context.url);
                    return;
                }
                else if(parsed_context.people&&parsed_context.people.length>0 && parsed_context.people[0].url!==undefined && type==="query"&&
                        my_query.try_count[type]===0) {
                    my_query.try_count[type]++;
                    var search_str=parsed_context.people[0].url.replace(/.*\?q\=/,"").replace(/\&filters.*$/,"").replace(/\+/g," ");
                    console.log("search_str=",search_str);
                    query_search(search_str, resolve, reject, query_response,"query");
                    return;

                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(type==="query" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                    parsed_lgb.url=parsed_lgb.url.replace(/https?:\/\/www\.www\./,"https://www.");
                    resolve(parsed_lgb.url);
                    return;
                }

            }
            for(i=0; i < b_algo.length&&i<4; i++) {
                if((type==='webmdquery'||(type==='query' && my_query.try_count[type]>0)) && i>=3) break;
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="healthgrades" && /healthgrades\.com/.test(b_url) && !/group-directory\//.test(b_url) && !MTP.is_bad_name(my_query.name.replace(/M\.?D\.?/,"").trim(),b_name.replace(/[,\|].*$/,"").replace(/Dr\./,"").replace(/,?\s*MD/,""))
                   && new RegExp(my_query.parsed_name.lname,"i").test(b_name)) {
                    resolve(b_url);
                    return;
                }
                if(type==="query" && !MTP.is_bad_name(my_query.name,b_name) && /^http/.test(b_url) &&
                   new RegExp(my_query.parsed_name.lname,"i").test(b_name) && (!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1)) && !is_bad_name(b_name, p_caption) && (b1_success=true)) break;

                if(type==='webmdquery' && /\.webmd\.com/.test(b_url) && /\/doctor\//.test(b_url) && !/find\-a\-doctor\//.test(b_url) && /^http/.test(b_url) && (b1_success=true)) break;
                if(type==="query" && i===0  && (!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1)) && /medical|health|doctor/.test(b_url) && !is_bad_name(b_name,p_caption) &&  (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="query" && my_query.try_count[type]>=1 && parsed_lgb && parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
            resolve(parsed_lgb.url);
            return;
        }

        do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let search_str=my_query.name+" "+my_query.state;
            query_search(search_str, resolve, reject, query_response,"query");
            return;

        }
        if(type==="healthgrades" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let search_str=my_query.name+" "+my_query.state+" healthgrades";
            query_search(search_str, resolve, reject, query_response,"healthgrades");
            return;

        }
        reject("Nothing found");
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
    function scrape_provider_details(doc,url,providers) {
        var loc=providers.querySelectorAll(".location"), curr, results=[];
        let title,address1,city,state,zip,phone_icon,fax_icon,phone,fax,specialty;
        if((specialty=doc.querySelector("[itemprop='medicalSpecialty']"))) {
            set_specialty(specialty.innerText.trim());
        }
        for(curr of loc) {
            var counter=0;
            let temp_result={};
            if((title=curr.querySelector(".location-title"))) temp_result.name=title.innerText.trim(); else counter++;
            if((address1=curr.querySelector("[itemprop='streetAddress']"))) {
                temp_result.address1=address1.innerText.trim();
                if(/,/.test(address1)) { temp_result.address1=address1.replace(/,.*$/,""); temp_result.address2=address1.replace(/^[^,]*,/,""); }

            }
            else counter++;
            if((city=curr.querySelector("[itemprop='addressLocality']"))) temp_result.city=city.innerText.trim(); else counter++;
            if((state=curr.querySelector("[itemprop='addressRegion']"))) temp_result.state=state.innerText.trim(); else counter++;
            if((zip=curr.querySelector("[itemprop='postalCode']"))) temp_result.zip=zip.innerText.trim(); else counter++;
            if((phone_icon=curr.querySelector(".icon-phone")) && phone_icon.parentNode&&phone_icon.parentNode.nextElementSibling) {
                temp_result.phone_number=phone_icon.parentNode.nextElementSibling.innerText.trim().replace(/[^\d]+/g,"").replace(/^1/,""); }
            else counter++;

            if((fax_icon=curr.querySelector(".icon-print")) && fax_icon.parentNode&&fax_icon.parentNode.nextElementSibling)
            {
                temp_result.fax_number="1"+fax_icon.parentNode.nextElementSibling.innerText.trim().replace(/[^\d]+/g,"").replace(/^1/,"").trim();
            }
            else counter+=2;

            temp_result.priority=counter;
            temp_result.source_website=url;
            console.log("temp_result=",temp_result);
            results.push(temp_result);
        }
        return results;
    }
    function scrape_itemtype(doc,url,itemtype) {
        var y;
        var temp_result={};

        var prop_map={"name":"name","affiliation":"name","telephone":"phone_number","faxNumber":"fax_number"};
        var x,temp,add;
        for(y of itemtype) {
            if(/Person/.test(y.getAttribute('itemtype'))) {
            }
            if(/addressPostalAddress/.test(y.getAttribute('itemtype'))) {
            }
            console.log("y=",y,"y.itemtype=",y.getAttribute('itemtype'));
            if(/MedicalSpecialty/i.test(y.getAttribute('itemtype'))) {
                let specialty_name=y.querySelector("[itemprop='name']");
                if(specialty_name) {
                    console.log("Specialty = ",specialty_name.innerText.trim());
                    set_specialty(specialty_name.innerText.trim());
                }
            }
            for(x in prop_map) {
                if((temp=y.querySelector("[itemprop='"+x+"']"))) {
                    //  console.log("temp=",temp);
                    temp_result[prop_map[x]]=temp.innerText.trim();
                }
                if(x==='telephone'&&temp_result[prop_map[x]]) temp_result[prop_map[x]]=temp_result[prop_map[x]].replace(/[^\d]+/g,"").replace(/^1/,"");
                if(x==='faxNumber'&&temp_result[prop_map[x]])   temp_result[prop_map[x]]="1"+temp_result[prop_map[x]].replace(/[^\d]+/g,"").replace(/^1/,"");
            }
            if((add=y.querySelector("[itemprop='address']"))) {
                let temp_add;
                if(add.content) {
                    temp_add=new Address(add.content);
                    for(x in add_map) {
                        temp_result[add_map[x]]=temp_add[x];
                    }

                }
                else {
                    console.log("In add, add=",add," no content");
                    let temp_name=add.querySelector("[itemprop='name'],[itemprop='legalName']");
                    if(temp_name) temp_result['name']=temp_name.innerText.trim();
                    console.log("add.querySelector(\"[itemprop='streetAddress']\")=",add.querySelector("[itemprop='streetAddress']"));
                    temp_result.address1=add.querySelector("[itemprop='streetAddress']")?add.querySelector("[itemprop='streetAddress']").innerText:"";
                    if(!temp_result.address1) temp_result.address1=add.querySelector("[itemprop='streetAddress']")?add.querySelector("[itemprop='streetAddress']").content:"";
                    temp_result.city=add.querySelector("[itemprop='addressLocality']")?add.querySelector("[itemprop='addressLocality']").innerText:"";
                    if(!temp_result.city) temp_result.city=add.querySelector("[itemprop='addressLocality']")?add.querySelector("[itemprop='addressLocality']").content:"";
                    temp_result.state=add.querySelector("[itemprop='addressRegion']")?add.querySelector("[itemprop='addressRegion']").innerText:"";
                    if(!temp_result.state) temp_result.state=add.querySelector("[itemprop='addressRegion']")?add.querySelector("[itemprop='addressRegion']").content:"";

                    temp_result.postcode=add.querySelector("[itemprop='postalCode']")?add.querySelector("[itemprop='postalCode']").innerText:"";
                    if(!temp_result.postcode) temp_result.postcode=add.querySelector("[itemprop='postalCode']")?add.querySelector("[itemprop='postalCode']").content:"";

                }

            }
            console.log("itemtype, temp_result=",temp_result," length=",Object.keys(temp_result).length);
            if(Object.keys(temp_result).length>=5&&temp_result.phone_number && temp_result.fax_number) {
                temp_result.priority=0;
                temp_result.source_website=url;
                if(!temp_result.name) {
                    let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
                    console.log("names=",names);
                    if(names.length>0) { temp_result.name=names[0].name; }
                }
                console.log("temp_result=",temp_result," length=",Object.keys(temp_result).length);
                my_query.office_list.push(temp_result);
            }


        }
        add_to_sheet();
    }
    function scrape_ihlocations(doc, url, locations) {

        var name,address,phone,fax;
        var loc;
        for(loc of locations) {
            var temp_result={}
            name=loc.querySelector(".ih-field-locationname");
            address=loc.querySelector(".ih-field-locationaddress");
            phone=loc.querySelector(".ih-field-phone");
            fax=loc.querySelector(".ih-field-fax");

            if(address) {
                let temp_address1=(add.innerText.trim());
                let temp_add=new Address(temp_address1);

                for(x in add_map) {
                    temp_result[add_map[x]]=temp_add[x];
                }
            }
            if(name) temp_result.office_name=name.innerText.trim();
            if(phone) temp_result.phone_number=phone.innerText.trim();
            if(fax) temp_result.fax_number=fax.innerText.trim();
            if(Object.keys(temp_result).length>=5&&temp_result.phone_number && temp_result.fax_number) {
                temp_result.priority=0;
                temp_result.source_website=url;
                if(!temp_result.name) {
                    let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
                    console.log("names=",names);
                    if(names.length>0) { temp_result.name=names[0].name; }
                }
                console.log("temp_result=",temp_result," length=",Object.keys(temp_result).length);
                my_query.office_list.push(temp_result);
            }
        }
        add_to_sheet();

    }

    function scrape_ascension(doc, url, locations) {

        var name,address,phone,fax;
        var loc;
        console.log("locations=",locations);
        for(loc of locations) {
            var temp_result={}
            name=loc.querySelector(".location-name  a");
            console.log("name=",name);
            address=loc.querySelector(".address-map-link");
            let phones_lab=loc.querySelectorAll(".address-phone .profileLabel");
            let phones_dat=loc.querySelectorAll(".address-phone .profileData");
            let x,y;
            console.log("phones_lab=",phones_lab);
            console.log("phones_dat=",phones_dat);

            for(y=0; y<phones_lab.length;y++) {
                if(/Phone/.test(phones_lab[y].innerText) && phones_dat[y]) phone=phones_dat[y].innerText.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
                if(/Fax/.test(phones_lab[y].innerText)&& phones_dat[y]) fax="1"+phones_dat[y].innerText.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
            }
            //phone=loc.querySelector(".ih-field-phone");
            //fax=loc.querySelector(".ih-field-fax");

            if(address) {
                let temp_address1=(address.innerText.trim());
                let temp_add=new Address(temp_address1);

                for(x in add_map) {
                    temp_result[add_map[x]]=temp_add[x].trim();
                }
            }
            if(name) temp_result.name=name.innerText.trim();
            if(phone) temp_result.phone_number=phone.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
            if(fax) temp_result.fax_number="1"+fax.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
            if(Object.keys(temp_result).length>=5&&temp_result.phone_number && temp_result.fax_number) {
                temp_result.priority=0;
                temp_result.source_website=url;
                if(!temp_result.name) {
                    let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
                    console.log("names=",names);
                    if(names.length>0) { temp_result.name=names[0].name; }
                }
                console.log("temp_result=",temp_result," length=",Object.keys(temp_result).length);
                my_query.office_list.push(temp_result);
            }
        }
        add_to_sheet();

    }

    function parse_nap(nap,ctr) {
        console.log("nap=",nap);
        var name=nap.querySelector(".fn.org");
        var phone=nap.querySelector(".tel.mm-phone-number");
        var adr=nap.querySelector(".adr"),span;
        if(name) my_query.fields["office"+ctr+"_name"]=name.innerText.trim();
        if(phone) my_query.fields["office"+ctr+"_phone_number"]=phone.innerText.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(adr && (span=adr.querySelectorAll("span")) && span.length===4) {
            my_query.fields["office"+ctr+"_address1"]=span[0].innerText.trim();
            my_query.fields["office"+ctr+"_city"]=span[1].innerText.trim();
            my_query.fields["office"+ctr+"_state"]=span[2].innerText.trim();
            my_query.fields["office"+ctr+"_zip"]=span[3].innerText.trim();
            add_to_sheet();
        }

    }

    function parse_patientpoploc(doc,url,resolve, reject,ctr) {
        console.log("parse_patientpoploc,url=",url,"ctr=",ctr);
        var promise_list=[];
        var curr_promise;
        var blocks=doc.querySelector(".location-blocks");
        if(blocks && ctr!==1 && ctr!==2)  {
            let a=doc.querySelectorAll(".location-block .location-address a");
            let i;
            for(i=0;i<a.length&&i<2; i++) {
                a[i].href=MTP.fix_remote_url(a[i].href,url);
                curr_promise=MTP.create_promise(a[i].href,parse_patientpoploc,function() { },function() { },(i+1));
                promise_list.push(curr_promise);
            }
            Promise.all(promise_list).then(resolve).catch(reject);
            return;
        }
        var name=doc.querySelector(".main-text"), phone=doc.querySelector(".location-details .mm-phone-number");
        var temp_result={};
        let add_field;
        var add=doc.querySelector(".location-address"), fax=doc.querySelector("#location-fax");
        if(name) temp_result.name=name.innerText.trim();
        if(phone) temp_result.phone_number=phone.innerText.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
        if(fax) temp_result.fax_number=1+fax.innerText.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
        if(add) {
            let addString="", child;
            for(child of add.childNodes) {
                if(child.nodeType === Node.TEXT_NODE) addString=addString+(addString.length>0?",":"")+child.textContent;
            }
            let temp_add=new Address(addString);
            for(add_field in add_map) temp_result[add_map[add_field]]=temp_add[add_field];
        }

        if(Object.keys(temp_result).length>=5&&temp_result.phone_number && temp_result.fax_number) {
            temp_result.priority=0;
            temp_result.source_website=url;
            if(!temp_result.name) {
                let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
                console.log("names=",names);
                if(names.length>0) { temp_result.name=names[0].name; }
            }
            console.log("temp_result=",temp_result);
            my_query.office_list.push(temp_result);
            add_to_sheet();
        }

    }

    function scrape_nch(doc,url,nch) {
        var name,address,phone,fax;
        var loc;

        var temp_result={}
        name=nch.querySelector(".nch-col-primary-office strong");
        address=loc.querySelector(".nch-col-primary-office a");
        phone=loc.querySelector(".nch-col-phone li");
        fax=loc.querySelector(".nch-col-fax li");

        if(address) {
            let temp_address1=(add.innerText.trim());
            let temp_add=new Address(temp_address1);

            for(x in add_map) {
                temp_result[add_map[x]]=temp_add[x];
            }
        }
        if(name) temp_result.office_name=name.innerText.trim();
        if(phone) temp_result.phone_number=phone.innerText.trim();
        if(fax) temp_result.fax_number=fax.innerText.trim();
        console.log("temp_result=",temp_result);
        if(Object.keys(temp_result).length>=5&&temp_result.phone_number && temp_result.fax_number) {
            temp_result.priority=0;
            temp_result.source_website=url;
            if(!temp_result.name) {
                let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
                console.log("names=",names);
                if(names.length>0) { temp_result.name=names[0].name; }
            }
            console.log("temp_result=",temp_result," length=",Object.keys(temp_result).length);
            my_query.office_list.push(temp_result);
        }

        add_to_sheet();
    }

    function parse_johnmuir(doc,url,resolve,reject,response) {
        let responseJSON=JSON.parse(response.responseText);
        let office=responseJSON.offices[0];
        set_specialty(responseJSON.specialties[0].name);
        var temp_result={"priority":0,"name":"John Muir Health","address1":office.addressLineOne, "address2":office.addressLineTwo,
                         "city":office.city,"state":office.state,
                         "zip":office.zip,
                         "phone_number":office.phoneNumber.replace(/[^\d]+/g,"").replace(/^1/,"").trim(),
                         "fax_number":1+office.faxNumber.replace(/[^\d]+/g,"").replace(/^1/,"").trim(),
                         "source_website":url};
        my_query.office_list.push(temp_result);
        add_to_sheet();
        resolve("");
    }
    function parse_nm(doc,url,resolve,reject,response) {
        let responseJSON=JSON.parse(response.responseText);
        let office=responseJSON.PrimaryLocation;
        var temp_result={"priority":0,"name":office.DisplayName,"address1":office.Address1, "address2":office.Address2,
                         "city":office.City,"state":office.State,
                         "zip":office.PostalCode,
                         "phone_number":office.Phone.replace(/[^\d]+/g,"").replace(/^1/,"").trim(),
                         "fax_number":1+office.Fax.replace(/[^\d]+/g,"").replace(/^1/,"").trim(),
                         "source_website":url};
        my_query.office_list.push(temp_result);
        add_to_sheet();
        resolve("");
    }

    function parse_spectrumhealth(doc,url,resolve,reject,response) {
        console.log("response=",response);
        let add_field;
        let responseJSON=JSON.parse(response.responseText);
        console.log("responseJSON=",responseJSON);
        var name, phone,fax,addString;
        var x;
        var temp_result={};

        name=responseJSON.LocationNamePrimary;
        phone=responseJSON.Phone;
        fax=responseJSON.Fax;
        if(responseJSON.OfficeLocationNames.length>0) {
            addString=responseJSON.OfficeLocationNames[0].StreetAddress+", "+responseJSON.OfficeLocationNames[0].CityStateZip;
        }
        if(name) temp_result.name=name.trim();
        if(phone) temp_result.phone_number=phone.replace(/[^\d]+/g,"").replace(/^1/,"").trim();
        if(fax) temp_result.fax_number=1+fax.replace(/[^\d]+/g,"").replace(/^1/,"").trim();

        let temp_add=new Address(addString);
        for(add_field in add_map) {
            temp_result[add_map[add_field]]=temp_add[add_field];
        }
        for(x of responseJSON.Specialty) {
            if(x.Type==="Specialty") {
                console.log("Setting specialty to ",x);
                set_specialty(x.Description);
            }
        }


        if(Object.keys(temp_result).length>=5&&temp_result.phone_number && temp_result.fax_number) {
            temp_result.priority=0;
            temp_result.source_website=url;
            if(!temp_result.name) {
                let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
                console.log("names=",names);
                if(names.length>0) { temp_result.name=names[0].name; }
            }
            console.log("temp_result=",temp_result);
            my_query.office_list.push(temp_result);
            add_to_sheet();


        }
        resolve("");
    }


    function scrape_doctor(doc,url,resolve,reject,extra) {
        //   console.log("scrape_doctor, doc=",doc.body.innerHTML);
        let placename;

        var providers=doc.querySelector("#provider-details-locations");
        var nch=doc.querySelector(".nch-dp-card");
        var ihlocations=doc.querySelectorAll(".ih-field-locations");
        var ascension=doc.querySelectorAll(".location #practices_MD .location-info");

        var itemtype=doc.querySelectorAll("[itemtype*='schema.org']");
        var x,i;
        var good_itemtype_list=[], found_good_itemtype=false;

        if(doc.querySelector("img[src*='patientpop.com']")) {
            console.log("*** found patientpop");
            var nap=doc.querySelectorAll("footer .nap"),counter=1;
            if(nap.length>0) {
                for(x of nap) { parse_nap(x,counter); counter++;
                               if(counter>2) { break; }
                              }
                var new_url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1")+"/contactus";
                var promise=MTP.create_promise(new_url,parse_patientpoploc,resolve,reject);
                return;
            }
        }

        for(i=itemtype.length-1; i>=0;i--) {
            x=itemtype[i];
            let actualtype=x.getAttribute('itemtype').replace(/https?:\/\/schema\.org\//,"").trim();
            if(!bad_schemas.includes(actualtype)) {
                console.log("actualtype=",actualtype);
                found_good_itemtype=true;
                good_itemtype_list.push(x);
            }
        }

        var phone=doc.querySelector(".phone > a");
        var fa_fax = doc.querySelector("i.fa-fax");
        if(fa_fax) {
            console.log("**** FOUND fa_fax");
            let temp_fax;
            var curr_node=fa_fax;
            while(curr_node) {
                if((temp_fax=curr_node.innerText.match(/([\([(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6})/))) {
                    console.log("temp_fax=",temp_fax);
                    break;
                }
                curr_node=curr_node.parentNode;
            }
            if(temp_fax && !my_query.fields['office1_fax_number']) {
                my_query.fields['office1_fax_number']=1+temp_fax[1].trim().replace(/[^\d]+/g,"").replace(/^1/,"");
            }
        }
        var fax=doc.querySelector(".fax > a");
        if(phone && phone.innerText.trim().replace(/[^\d]+/g,"").replace(/^1/,"").length<6 &&
           doc.querySelectorAll(".phone > a").length>1) phone=doc.querySelectorAll(".phone > a")[1];
        if(phone)  my_query.fields['office1_phone_number']=phone.innerText.trim().replace(/[^\d]+/g,"").replace(/^1/,"");
        if(!phone) {
            let temp_phone=doc.querySelector("a[href^='tel']");
            console.log("phone=",temp_phone);
            if(temp_phone) {
                phone=temp_phone.href.trim().replace(/[^\d]+/g,"").replace(/^1/,"");
                if(!/^0{3,}/.test(phone)&&phone.length>=10) my_query.fields['office1_phone_number']=phone;
                else phone="";
            }
        }
        if(fax) my_query.fields['office1_fax_number']=1+fax.innerText.trim().replace(/[^\d]+/g,"").replace(/^1/,"");;
        if((my_query.fields['office1_phone_number']||(phone=doc.body.innerText.match(/(?:Tel|Phone|P|T|Office):?\s*\n*\s*([\([(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6})/im))
            ||(phone=doc.body.innerText.match(/([\([(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6})\s*\n*\s*(?:Tel|Phone|Office)/im))
           ) && !fax &&
           ((fax=doc.body.innerText.match(/(?:F:|Fax):?\s*\n*\s*([\([(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6})/im)) ||
            (fax=doc.body.innerText.match(/([\([(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6})\s*\n*\s*(?:Fax)/im)))) {
            console.log("phone=",phone,"fax=",fax);
            if(!my_query.fields['office1_phone_number'])             my_query.fields.office1_phone_number=phone[1].trim().replace(/[^\d]+/g,"").replace(/^1/,"");
            else { console.log("my_query.fields['office1_phone_number']=",my_query.fields['office1_phone_number']); }
            my_query.fields.office1_fax_number=1+fax[1].trim().replace(/[^\d]+/g,"").replace(/^1/,"");
            add_to_sheet();
            //console.log("my_query.fields=",my_query.fields);
        }

        if(providers) {
            my_query.office_list=my_query.office_list.concat(scrape_provider_details(doc,url,providers));
            resolve("");
            return;
        }
        else if(nch) {
            scrape_nch(doc,url,nch);
            resolve("");
            return;
        }
        else if(ihlocations.length>0) {
            console.log("ihlocations=",ihlocations);
            scrape_ihlocations(doc,url,ihlocations);
            resolve("");
            return;
        }
        else if(ascension.length>0) {
            scrape_ascension(doc,url,ascension);
            resolve("");
            return;
        }
        else if(/johnmuirhealth\.com/.test(url)) {
            let johnmuir_url="https://www.johnmuirhealth.com/fad/api/doctor/"+my_query.npi;
            let promise=MTP.create_promise(johnmuir_url,parse_johnmuir,resolve,reject);
            return;
        }
        else if(/www\.nm\.org/.test(url)) {
            let nm_url="https://www.nm.org/northwestern/physicians/getlocations?id="+my_query.npi+"&longitude=-2&latitude=3";
            console.log("nm_url=",nm_url);
            let promise=MTP.create_promise(nm_url,parse_nm,resolve,reject);
            return;
        }
        var spectrum_match;
        if(spectrum_match=url.match(/findadoctor\.spectrumhealth\.org\/physician\/profile\/([\d]+)/)) {

            var spectrum_url="https://findadoctor.spectrumhealth.org/api/providers/GetProviders/"+spectrum_match[1];
            console.log("spectrum_url=",spectrum_url);
            let promise=MTP.create_promise(spectrum_url,parse_spectrumhealth,resolve,reject);
            return;
        }
        if(good_itemtype_list.length>0&&found_good_itemtype) {
            console.log("*** itemtype=",good_itemtype_list);
            scrape_itemtype(doc,url,good_itemtype_list);
        }
        console.log("doing address,url=",url);


        Address.scrape_address(doc,url,resolve,reject,extra);

    }

    /* Extra has some kinda of type field and a depth field indicating the depth */
    Address.scrape_address=function(doc,url,resolve,reject,extra) {

        let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
        console.log("*** names=",names);
        if((!my_query.fields.office1_name||my_query.fields.office1_name.trim().length===0) && names.length>0) {
            my_query.fields.office1_name=names[0].name;
            add_to_sheet();
        }
        var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];



        Address.debug=extra.debug;
        var contact_regex=/(Contact|Location|Privacy|Kontakt|About)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
        // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
        console.log("In scrape_address for type="+type+", url="+url);



        if(depth===0) {
            for(i=0; i < links.length; i++) {
                links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
                if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
                   && !bad_contact_regex.test(links[i].href) &&
                   !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                    Address.queryList.push(links[i].href);
                    console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                    promise_list.push(MTP.create_promise(links[i].href,Address.scrape_address_page,function(result) {
                    },MTP.my_catch_func,type));
                    continue;
                }
                else if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))) {
                    console.log("Link labeled "+links[i].innerText+" to "+links[i].href+" not followed");
                }
            }
        }
        // scrape this page
        promise_list.push(new Promise((resolve1,reject1) => {
            Address.scrape_address_page(doc,url,resolve1,reject1,type);
        }).then(MTP.my_then_func).catch(MTP.my_catch_func));
        Promise.all(promise_list).then(function(result) {
            resolve(names); })
            .catch(function(result) { if(Address.debug) console.log("Done all promises in scrape_address for "+type);
                                     if(Address.debug) console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
                                     resolve(""); });
    };

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.practice_url=result;
        if(/\.webmd\.com/.test(result)) {
            return;
        }

        my_query.fields['office1_source_website']=result;
        add_to_sheet();
        var promise=MTP.create_promise(my_query.practice_url,scrape_doctor,address_scrape_then,function(response) {
            console.log("Failed address ",response); },{type:"",depth:0});

    }

    function set_specialty(given_specialty) {
        let specialty=given_specialty;
        specialty=specialty.replace("Geriatric Medicine","Geriatrics").replace("Pulmonary Disease","Pulmonary Medicine")
            .replace(/^Diabetes$/,"Endocrinology, Diabetes, & Metabolism").replace("General Practice","Internal Medicine")
            .replace("Child & Adolescent Psychiatry","Psychiatry").replace("Pulmonary Critical Care","Pulmonary Medicine").replace("Orthopedic Surgery","Orthopaedic Surgery")
            .replace("Cardiovascular Disease","Cardiovascular").replace(/.*Endocrinology.*$/,"Endocrinology Diabetes & Metabolism")
            .replace(/^.*Podiatr.*$/,"Podiatrist").replace("Child Neurology","Neurology").replace(/^.*Oncology$/,"Hematology & Oncology")
            .replace("Pediatric Pulmonology","Pulmonary Medicine").replace("Optometry","Optometrist").replace(/.*\sOncology.*$/,"Oncology")
            .replace(/.*Otolaryngology.*/,"Otolaryngology").replace(/.*General Surgery.*/,"Surgery").replace(/^.*Gynecology.*$/,"Obstetrics & Gynecology").
        replace(/^.*Pulmonary.*$/,"Pulmonology").replace(/^.*(Electrophysiology|Cardiology).*$/,"Cardiology").replace(/^.*General Surgery.*$/,"Surgery")
            .replace(/.*Psychiatry.*/,"Psychiatry").replace(/^.*Pediatrics.*$/,"Pediatrics").replace(/^.*Allergy.*$/,"Allergy & Immunology")
            .replace(/^.*Geriatric.*$/,"Geriatric Medicine").replace(/^.*Obstetrics.*$/,"Obstetrics & Gynecology")
            .replace(/^.*Nephrology.*$/,"Nephrology").replace(/^.*Plastic Surgery.*$/,"Plastic and Reconstructive Surgery")
            .replace(/^.*Pediatrics.*$/,"Pediatrics").replace(/^.*General Surgery.*$/,"Surgery").replace(/^.*Occupational Health.*$/,"Occupational Medicine")
            .replace(/^.*Family.*$/,"Family Medicine");
        console.log("specialty=",specialty," actual_specialty=",my_query.actual_specialty);
        let opt;
        for(opt of document.querySelector("#specialty1").options) {
            if(opt.value===specialty) {
                console.log("** Matched on ",opt.value);
                if(!my_query.actual_specialty) {
                    console.log("Setting specialty=",specialty);

                    my_query.actual_specialty=opt.value;
                }
            }
        }
        if(my_query.actual_specialty) {
            console.log("* actually setting specialty=",my_query.actual_specialty);
            document.querySelector("[name='specialty1']").value=my_query.actual_specialty;
        }
    }

    function webmdquery_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.practice_url=result;
        result=result.replace(/\-overview$/,'-appointments');
        let promise=MTP.create_promise(result,query_web_md,query_web_md_then,function(result) {
            console.log("failed webmd");
            my_query.done.webmd=true;
            if(!my_query.fields["office1_fax_number"]||my_query.fields["office1_fax_number"]==="1") {
                find_healthgrades();
            }
            else {
                my_query.done.healthgrades=true;
                submit_if_done();
            }
        });


    }
    function address_scrape_then(result) {

        //console.log("result="+result);
        Address.addressList.sort(function(a,b) { return a.priority-b.priority; });
        //console.log("addressList="+JSON.stringify(Address.addressList));
        if(Address.addressList.length>=1) {
            if(result && result[0] && result[0].name) {
                my_query.fields.office1_name=result[0].name;
            }
            update_address(Address.addressList[0],'1');
            add_to_sheet();
        }
        my_query.done.doctor=true;
        submit_if_done();
    }

    function query_web_md(doc,url,resolve,reject) {
        console.log("query_web_md,url="+url);
        var specialty;
        try {
            specialty=doc.querySelector(".prov-specialty-name").innerText.trim()
            specialty=specialty.replace("Geriatric Medicine","Geriatrics").replace("Pulmonary Disease","Pulmonary Medicine")
                .replace(/Diabetes/,"Endocrinology, Diabetes, & Metabolism").replace("General Practice","Internal Medicine")
                .replace("Child & Adolescent Psychiatry","Psychiatry").replace("Pulmonary Critical Care","Pulmonary Medicine").replace("Orthopedic Surgery","Orthopaedic Surgery")
                .replace("Cardiovascular Disease","Cardiology").replace("Endocrinology, Diabetes & Metabolism","Endocrinology Diabetes & Metabolism")
                .replace("Podiatric Medicine","Podiatry").replace("Child Neurology","Neurology").replace("Hematology/Oncology","Hematology & Oncology")
                .replace("Critical Care Medicine","Pulmonology")
                .replace("Pediatric Pulmonology","Pulmonary Medicine").replace("Optometry","Optometrist").replace(/.*\sOncology.*$/,"Hematology & Oncology").
            replace(/*Otolaryngology*/i,"Otolaryngology").
            replace(/Pain /,"Pain Medicine");
            console.log("SPECIALTY: "+specialty);
            var is_available=false,i;
            for (i = 0; i < document.querySelector("[name='specialty1']").length; ++i){
                if ( document.querySelector("[name='specialty1']").options[i].value === specialty){
                    is_available=true;
                    break;
                }
            }
            if(is_available&&!my_query.specialty) {
                document.querySelector("[name='specialty1']").value=specialty;
            }
        }
        catch(err) {
            console.log("specialty name not found"); }

        var full_locs=doc.querySelectorAll("div.location"),curr_loc;
        var practice_loc = doc.querySelector(".location-practice-name a")


        if(my_query.fields['office1_source_website']!==undefined &&my_query.fields['office1_source_website'].length>0) {

            if(!my_query.fields.office1_name) {
                for(curr_loc of full_locs) {
                    var loc_link=curr_loc.querySelector(".location-practice-name a"), loc_add=curr_loc.querySelector(".location-address"), loc_geo=curr_loc.querySelector(".location-geo");
                    if(!loc_add || !loc_geo || !loc_link) continue;
                    let temp_add=new Address(loc_add.innerText.trim()+"," + loc_geo.innerText.trim());
                    console.log("temp_add from webmd=",temp_add, "my_query.fields=",my_query.fields);
                    if(temp_add.address1 && temp_add.city && my_query.fields.office1_address1 && my_query.fields.office1_city &&
                       temp_add.address1.split(/\s/)[0].toLowerCase()===my_query.fields.office1_address1.split(/\s/)[0].toLowerCase() && temp_add.city.toLowerCase()===my_query.fields.office1_city.toLowerCase()) {
                        my_query.fields.office1_name=loc_link.innerText.trim();
                    }
                }
            }


            reject(""); }

        if(practice_loc) {
            let promise=MTP.create_promise(practice_loc.href,query_md_practice,resolve,reject);
        }
        else {
            console.log("Rejecting webmd");
            reject("");
        }
    }

    function query_md_practice(doc,url,resolve,reject) {
        console.log("query_web_md_practice,url="+url);
        //if(my_query.fields['09_website_01'].length>0) return;
        var name,add_text,add;
        name=doc.querySelector(".topoffice h4");
        if(my_query.fields['office1_source_website']!==undefined &&my_query.fields['office1_source_website'].length>0) return;
        try {
            add_text=doc.querySelector('.address strong').innerHTML.replace('<br>','\n').trim();

            add=new Address(add_text,-50);
            var phone=doc.querySelector(".practicephone").innerText.trim();
            var fax=doc.querySelector("[itemprop='faxNumber']").innerText.trim().replace(/^\s*Fax:\s*/,"");
            my_query.fields['office1_name']=name.innerText.trim();
            if(my_query.office_list.length>0) {
                console.log("Returning early");
                resolve("");
                return;
            }

            if(phone.replace(/[^\d]+/g,"").replace(/^1/,"").length>0) my_query.fields['office1_phone_number']=phone.replace(/[^\d]+/g,"").replace(/^1/,"");;
            if(fax.replace(/[^\d]+/g,"").replace(/^1/,"").length>0) my_query.fields['office1_fax_number']=1+fax.replace(/[^\d]+/g,"").replace(/^1/,"");;
            my_query.fields['office1_source_website']=url;
            update_address(add,'1');
            add_to_sheet();
            if(!/Not Av/.test(fax)) resolve("");
            else reject("");
        }
        catch(error) {
            console.log("bad md_query");
            reject("");
            return;
        }


    }

    function query_web_md_then(result) {
        console.log("query_web_md_then,result="+JSON.stringify(result));
        my_query.done.webmd=my_query.done.healthgrades=true;
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
        //update_address();
        my_query.office_list.sort(function(a,b) { return a.priority-b.priority; });
        var i;
        for(i=0;i<2&&i<my_query.office_list.length;i++) {
            for(x in my_query.office_list[i]) my_query.fields["office"+(i+1)+"_"+x]=my_query.office_list[i][x];
        }


        for(x in my_query.fields) {
            if(/^undefined/.test(x)) continue;
            if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
        }
        if(!my_query.actual_specialty&&my_query.fields.office1_name) {
            var specialty_map={ "Allergy & Immunology":/Allergy(\s|$)/,"Dermatology":/Dermatology/,"Family Medicine":/Family(\s|$)/, "Gastroenterology":/Gastroenterology|(GI( |$))|Digestive/,

                               "Nephrology":/Nephrology/,"Orthopedic Surgery":/Orthopedic|(Bone|Joint)(\s|$)/,"Pain Medicine":/Spine|Pain(\s|$)/,
                               "Pediatrics":/Pediatric/,"Otolaryngology":/((^|\s)ENT(\s|$))|Otolaryngology/,
                               "Primary Care":/Primary Care/,"Psych/Mental Health":/Mental Health/,
                               "Vascular Surgery":/Vein(\s|$)/,"Women's Health":/Women/,
                               "Urgent Care":/(Urgent|Immediate) Care/, "Urology":/Urology/,
                               "Internal Medicine":/Internal Medicine/,};
            console.log("* NO specialty set");

            for(x in specialty_map) {
                if(my_query.fields.office1_name.match(specialty_map[x])) {
                    set_specialty(x);
                    break;
                }
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        var required_field_names=["phone_number","fax_number","city","name"];



        console.log("submit_if_done, my_query.done=",my_query.done,"my_query.fields=",my_query.fields);
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x of required_field_names) {
            if(!my_query.fields["office1_"+x]) {
                console.log("Missing office1_"+x);
                is_done=false;
            }
        }
        if(my_query.fields.office1_fax_number==="1") {
            console.log("No fax found");
            is_done=false;
        }
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function update_address(address,suffix) {
        var top,x;
        console.log("address=",address);
        if(typeof(address.text)==="string") {

            top=new Address(address.text.replace(/([a-z]{2,})([A-Z])/,"$1,$2").replace(/(\d+)([A-Z][a-z]+)/,"$1,$2"),address.priority);
            //        console.log("top="+JSON.stringify(top));
        }
        else {
            top=address;
        }
        if(top.postcode) top.zip=top.postcode;


        for(x in top) {
            //  console.log("Adding "+x+"_"+suffix);
            my_query.fields["office"+suffix+"_"+x]=top[x];
        }


    }
    function remove_phones(text,suffix,target) {
        var split=text.split(/\n/);

        var ret="",match,matched_phone=false,i;
        var phone_prefix_map={"01":"07","02":"16"},fax_prefix_map={"01":"08","02":"17"};
        var pasted_name=/office\d_name/.test(target.name),fax_match;
        for(i=0;i<split.length;i++) {
            if(fax_match=split[i].match(/Fax:\s*([\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6})/)) {
                my_query.fields["office"+suffix+"_fax_number"]="1"+fax_match[1].replace(/[^\d]+/g,"");
                split[i]=split[i].replace(fax_match[0],'');

            }
            if(i===0 && pasted_name && !/^.{0,10}[\d]/.test(split[i])) {
                console.log("Added "+"office"+suffix+"_name to equal "+split[i].trim());
                my_query.fields["office"+suffix+"_name"]=split[i].trim();
                continue;
            }
            match=split[i].match(phone_re);
            if(match) {
                if(!matched_phone && (matched_phone=true)) {
                    my_query.fields["office"+suffix+"_phone_number"]=match[0].replace(/[^\d]+/g,"");
                }
                else {
                    my_query.fields["office"+suffix+"_fax_number"]="1"+match[0].replace(/[^\d]+/g,""); }
            }
            else {
                ret=ret+(ret.length>0?"\n":"")+split[i];
            }
        }
        console.log("Returning ret="+ret);
        return ret;
    }
    function do_address_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var match=e.target.name.match(/(\d)\_/);

        var suffix=match?match[1]:"1";
        if(text.indexOf("\n")===-1 && !my_query.fields[e.target.name]) my_query.fields[e.target.name]=text;
        text=text.replace(/\s\|\s/g,"\n");
        //        console.log("text="+text);
        text=remove_phones(text,suffix,e.target);
        text=text.replace(/[a-z\.0-9]*@[a-z\.0-9]*/,"").trim();
        text=text.replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        //        console.log("e.target.name="+e.target.name);
        //       console.log("text="+text);
        var my_add=new Address(text,-50);
        my_add.priority=-50;
        if(my_add.priority<1000) {
            update_address(my_add,suffix,-50); }
        add_to_sheet();
        //  add_text(text);
    }
    function do_phone_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(/fax/.test(e.target.name)) text="1"+text;
        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }

    function do_fax_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(/fax/.test(e.target.name)) text="1"+text;
        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }

    function do_web_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        if(/healthgrades\.com|healthcare4ppl|webmd\.com/.test(text)) {
            document.querySelector("#radios-1").click();
        }
        else {
            document.querySelector("#radios-0").click();
        }
        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }


    function addr_cmp(add1,add2) {
        if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
        if(add1.priority<add2.priority) return -1;
        else if(add1.priority>add2.priority) return 1;
        else return 0;
    }

    function find_healthgrades(e) {
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.state + " site:healthgrades.com", resolve, reject, query_response,"healthgrades");
        });
        queryPromise.then(healthgrades_promise_then)
            .catch(function(val) {
            console.log("Failed at this healthgradesPromise " + val);
            my_query.done.healthgrades=true;
            submit_if_done();


        });
    }

    function healthgrades_promise_then(result) {
        my_query.healthgrades=result;
        console.log("my_query.healthgrades=",my_query.healthgrades);
        if(/healthgrades\.com/.test(result)) {
            var promise=MTP.create_promise(my_query.healthgrades,parse_healthgrades,parse_healthgrades_then,function() { });
        }
    }

    function parse_healthgrades(doc,url,resolve,reject) {
        var loc=doc.querySelector(".office-location");
        //  console.log("loc=",loc);

        var specialty=doc.querySelector("[data-qa-target='ProviderDisplaySpeciality']");
        if(specialty) {
            set_specialty(specialty.innerText.trim());
        }

        var h3=loc.querySelectorAll("h3,.visit-practice-link");
        var add=loc.querySelector("address");
        var phone=loc.querySelector("[href^='tel']");
        var fax=loc.querySelector("[href^='fax']");
        if((fax&&(fax.href.replace(/[^\d]+/g,"").replace(/^1/,"")).length>0)) { //
            let y;
            for(y of h3) {
                if(y && !/^\s*Practice\s*$/.test(y.innerText.trim())) {  my_query.fields.office1_name=y.innerText.trim();


                                                                       break; }
                if(y) y.parentNode.removeChild(y);
            }
            //if(h3) my_query.fields.office1_name=h3.innerText.trim();
            //if(h3) h3.parentNode.removeChild(h3);
            //    console.log("add=",add);
            if(add) {
                let span=add.querySelectorAll("span span");
                if(span.length===0) span=add.querySelectorAll("span");
                let add_str="";
                let i;
                for(i=0;i<span.length;i++) {
                    add_str=add_str+(add_str.length>0?", ":"")+span[i].innerText.trim();
                }
                let parsed_add=new Address(add_str);
                //  console.log("parsed_add=",parsed_add)
                update_address(parsed_add,"1");
            }
            if(phone) my_query.fields.office1_phone_number=phone.href.replace(/[^\d]+/g,"").replace(/^1/,"");
            if(fax) my_query.fields.office1_fax_number="1"+fax.href.replace(/[^\d]+/g,"").replace(/^1/,"");
            //console.log("phone=",phone,"fax=",fax);
            my_query.fields.office1_source_website=url;
        }

        resolve("");
    }
    function parse_healthgrades_then() {
        if(/healthgrades\.com/.test(my_query.fields.office1_source_website))
            document.querySelector("#radios-1").click();
        my_query.done.healthgrades=true;


        submit_if_done();
    }


    function parse_npi_json(response,resolve,reject,url) {
        console.log("parse_npi_json, response=",response);
        try {
            let result=JSON.parse(response.responseText), temp_result={};
            console.log("result=",result);
            let name=result.basic.firstName+" "+result.basic.lastName;
            my_query={name:name,specialty:"",title:"",state:"",url:"",fields:
                      {},done:{webmd:false,healthgrades:false,doctor:false},submitted:false,try_count:{"query":0},
                      office_list:[]}; // solution list is list of offices*/
            let x;
            for(x of result.taxonomies) {
                if(!temp_result.specialty && /Nurse|Physician/i.test(x.desc)) temp_result.specialty=x.specialization?x.specialization:x.desc;
                let temp_specialty=(x.specialization?x.specialization:x.desc); ///Nurse|Physician/i.test(x.desc)?"Family Medicine":
                if(!my_query.specialty ) {
                    set_specialty(temp_specialty);
                    if(!/Student/.test(temp_specialty) && my_query.actual_specialty) break;
                }
            }
            for(x of result.addresses) {
                if(x.addressPurpose==="LOCATION") {
                    temp_result.address1=x.addressLine1||"";
                    temp_result.address2=x.addressLine2||"";
                    temp_result.city=x.city||"";
                    temp_result.state=x.state||"";
                    temp_result.zip=x.postalCode?x.postalCode.substr(0,5):"";
                    temp_result.phone_number= x.teleNumber?x.teleNumber.replace(/[^\d]+/g,"").replace(/^1/,""):"";
                    temp_result.fax_number=x.faxNumber?"1"+x.faxNumber.replace(/[^\d]+/g,"").replace(/^1/,""):"";
                    temp_result.source_website=url;

                    console.log("temp_result=",temp_result);
                    for(x in temp_result) my_query.fields[x]=temp_result[x];
                    add_to_sheet();
                    if(x.faxNumber) break;
                }

            }
            if(!temp_result.specialty&&my_query.actual_specialty) temp_result.specialty=my_query.actual_specialty;
            resolve({name:name,address:add,temp_result:temp_result});
        }
        catch(e) {
            console.warn("Error, exception=",e);
            resolve({name:"",address:{}});
        }
    }

    function parse_npihhs(doc,url,resolve,reject) {
        let temp_url="https://npiregistry.cms.hhs.gov/RegistryBack/npiDetails";
        let payload=url.match(/(\d)+$/)[0];
        var headers={"Content-Type":"application/json;charset=UTF-8"};
        let my_data={"number":payload};
        console.log("my_data=",my_data);
        GM_xmlhttpRequest({method: 'POST', url: temp_url,headers:headers,data:JSON.stringify(my_data),
                           onload: function(response) { parse_npi_json(response, resolve, reject,url); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
        return;
    }

    function parse_npihhs_then(result) {
        let x;
        console.log("parse_npihhs_then, result=",result);
        my_query={name:result.name.replace(/\n.*$/,"").trim(),specialty:"",title:"",state:result.address&&result.address.state?reverse_state_map[result.address.state]:'',url:"",fields:
                  {},  done:{"doctor":false,"webmd":false,"healthgrades":false},
                  submitted:false,try_count:{"query":0}, office_list:[]}; // solution list is list of offices
        console.log("my_query="+JSON.stringify(my_query));
        my_query.parsed_name=MTP.parse_name(my_query.name);
        for(x in result.temp_result) {
            my_query.fields["office1_"+x] = result.temp_result[x];
        }
        if(!my_query.specialty) my_query.specialty=result.temp_result.specialty;
        add_to_sheet();
        var search_str=my_query.name+" "+my_query.specialty+" "+my_query.state+" "+my_query.title;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then).catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.doctor=true;
            submit_if_done();
        });
        const webmdqueryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:webmd.com", resolve, reject, query_response,"webmdquery");
        });
        webmdqueryPromise.then(webmdquery_promise_then)
            .catch(function(val) {
            my_query.done.webmd=true;
            if(!my_query.office1_fax_number || my_query.office1_fax_number==="1") {
                console.log("my_query.office1_fax_number=",my_query.office1_fax_number," finding healthgrades");

                find_healthgrades();
            }
            else {
                my_query.done.healthgrades=true;
                submit_if_done();
            }

        });
    }

    function init_Query()
    {
        console.log("in init_query rochargrove");
        var i,x, state_abbrev="";
        var p=document.querySelectorAll("crowd-form div div div p");
        for(i=0;i<5;i++) {
            p[i].parentNode.removeChild(p[i]);
        }
        var ul=document.querySelectorAll("form ul li");
        for(i of ul) i.parentNode.removeChild(i);
        var a=document.querySelector('a[href^="http://www.google"]');
        if(a) {
            a.href=a.href.replace("Student%20in%20an%20Organized%20Health%20Care%20Education/Training%20Program","");
        }
        var links=document.querySelectorAll("form a");
        links[0].href=links[0].href.replace(/\+Fax$/i,"").replace(/\+NULL/ig,"")
        var my_href=links[0].href.replace(/\+Fax$/i,"").replace(/\+NULL/ig,"").replace(/\%20/g," ").replace(/^.*\?q\=(.*)$/,"$1");

        var split=my_href.replace(" & ","+&+").split("++");
        console.log("my_href=",my_href.replace(" & ","+&+"),"split=",split);
        split[split.length-1]=split[split.length-1].replace(/\+/g,"").replace(/([a-z])([A-Z])/,"$1 $2");
        if(reverse_state_map[split[split.length-1]]!=undefined) state_abbrev=split[split.length-1];
        split[0]=split[0].replace(/\+/g," ");
        if(split.length<2) {
            my_href = my_href.replace(/\+/g," ").replace(/([a-z])([A-Z])/,"$1 $2");
            console.log("before match, my_href=",my_href);
            let my_match_re=/^(.*)\s((?:[^\s\+]+))$/;
            let my_match_re2=/^(.*)\s((?:[^\s]+)\s(?:[^\s]+))$/;
            let match=my_href.replace(/\+/g," ").match(my_match_re);
            if(!match) {
                console.log("initial match failed");
                match=my_href.replace(/\+/g," ").match(my_match_re2); }
            if(match) {
                split=[match[1],match[2]];
            }
            else split=[my_href,""];
        }
        else {
            console.log("split length=",split.length,"split=",split);
            split[1]=split[1].replace(/\+/g," ");
        }
        console.log("my_href="+my_href+",split="+split);
        var phone_list=["office1_phone_number","office2_phone_number"];
        var fax_list=["office1_fax_number","office2_fax_number"];
        document.getElementsByName("office1_address1")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("office1_name")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("office2_name")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("office2_address1")[0].addEventListener("paste",do_address_paste);
        //document.querySelectorAll("[name='source_quality']")[1].addEventListener("click",find_healthgrades);

        for(x of phone_list) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_phone_paste);
        }
        for(x of fax_list) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_fax_paste);
        }
        for(x of ['office1_source_website','office2_source_website']) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_web_paste);
        }

        if(/^[A-Z]{2}$/.test(my_href.replace(/\+/g,"").trim())) {
            let a=document.querySelector("a[href^='https://npiregistry.cms.hhs.gov']");
            a.href=a.href.replace(/\/registry/,"");

            let promise=MTP.create_promise(a.href,parse_npihhs,parse_npihhs_then,parse_npihhs_then);
            return;
        }

        var their_query_str=split[0].replace("Student in an Organized Health Care Education/Training Program","");//document.querySelectorAll("form div div span")[2].innerText.trim();
        their_query_str=their_query_str.trim();
        console.log("their_query_str="+their_query_str);
        var name_re=/^((?:[A-Z\-\.,]+\s)+)?\s?(?:(?:MD)(?:\s|$)|(?:DO)(?:\s|$)|(?:FNP)(?:\s|$)|(?:NP|CNP)(?:\s|$))?(.*[a-z].*)$/
        var name_re2=/^((?:[A-Z\-\.,]+\s?)+)/
        var name_re3=/^((?:[A-Z\-\.,]+\s?)+MD)/

        //var end_re=/[A-Z][a-z]+(\s)
        var name_match=their_query_str.match(name_re);
        console.log("name_match=",name_match);
        if(!name_match) name_match=their_query_str.match(name_re2);
        //if(!name_match) name_match=their_query_str.match(name_re3);

        if(/Student in/i.test(my_href)) {
            name_match[1]=name_match[0];
        }
        var title_re=/\s(MD|DO|FNP|NP|CNP|ARNP)$/i;

        var state_match=split[1].match(/\s*([A-Z]{2})\s*$/);
        if(split[1].length===0 && split.length>=3 && split[2].trim().length===2 && /^[A-Z]*$/.test(split[2])) state_match=[split[2].trim(),split[2].trim()];
        console.log("name_match="+JSON.stringify(name_match));

        let a2=document.querySelector("a[href^='https://npiregistry.cms.hhs.gov']");
        a2.href=a2.href.replace(/\/registry/,"");
        console.log("a2.href=",a2.href);

        let promise=MTP.create_promise(a2.href,parse_npihhs,function(result) { finish_init_query(name_match, state_abbrev,split, result); }
                                       , function() { GM_setValue("setup_complete",false); GM_setValue("returnHit",true); });
        return;


        //  var promise=MTP.create_promise(my_query.url,parse_hpd,parse_hpd_then);
    }

    function finish_init_query(name_match, state_match,split, result) {
        console.log("result=",result,"name_match=",name_match,"state_match=",state_match);
        var x;
        var title_re=/\s(MD|DO|FNP|NP|CNP|ARNP)$/i;
        var required_field_names=["phone_number","fax_number","city","name"];

        let old_specialty=result.temp_result.specialty;
        let a2=document.querySelector("a[href^='https://npiregistry.cms.hhs.gov']");

        var npi=a2.href.match(/\d+$/)[0];

        if(!my_query.fields) {
            my_query={name:name_match&&name_match.length>1&&name_match[1]?name_match[1].trim():"",specialty:name_match&&name_match.length>=3?name_match[2]:"",title:title,
                      state:state_match,url:"",npi:npi,
                      fields:{},
                      done:{"doctor":false,"webmd":false,"healthgrades":false},

                      submitted:false,try_count:{"query":0},

                      office_list:[]}; // solution list is list of offices
        }
        else {
            my_query.npi=npi;
            if(!my_query.state && state_match) my_query.state=state_match;
        }
        for(x in result.temp_result) {
            my_query.fields["office1_"+x] = result.temp_result[x];
        }
        add_to_sheet();


        if(old_specialty) my_query.specialty=old_specialty;
        if(!my_query.specialty && split.length>1) my_query.specialty=split[1];
        my_query.name=my_query.name.replace(/\s(NP|MD|APRN|PA-C|PA)$/,"").trim();
        console.log("temp=",my_query.name.replace(/^([^\s]*\s[^\s]*).*$/,"$1"));
        set_specialty(my_query.specialty);

        console.log("MOOO");
        my_query.parsed_name=MTP.parse_name(my_query.name.replace(/^([^\s]*\s[^\s]*).*$/,"$1"));
        var title=name_match.length>1?my_query.name.trim().match(title_re):"";
        my_query.title=title?title[0].trim():"";

        my_query.name=my_query.name.replace(title_re,"").trim();
        console.log("my_query.parsed_name=",my_query.parsed_name);
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.specialty+" "+my_query.state+" "+my_query.title;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.doctor=true;
            submit_if_done();


        });
        const webmdqueryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:webmd.com", resolve, reject, query_response,"webmdquery");
        });
        webmdqueryPromise.then(webmdquery_promise_then)
            .catch(function(val) {
            my_query.done.webmd=true;
            if(!my_query.office1_fax_number || my_query.office1_fax_number==="1") {
                console.log("my_query.office1_fax_number=",my_query.office1_fax_number," finding healthgrades");
                find_healthgrades();
            }
            else {
                my_query.done.healthgrades=true;
                submit_if_done();
            }
        });
    }

})();