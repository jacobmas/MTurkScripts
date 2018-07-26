 function parse_manta(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("Parsing manta");
        var i,j;
        var name="",title="";
        var pres_re=/(President)|(CEO)|(Chief Executive Officer)/i;
        var bad_pres_re=/(Vice[\s\-]President)|(Market President)|(Regional President)/i;
        var result={};
        var result2={"telephone":"","employee":[],"streetAddress":"","addressLocality":"","addressRegion":"","postalCode":"",
                   "foundingDate":"","isicV4":""};
        try
        {
            var contact=doc.getElementById("contact");

            var prop_fields=doc.querySelectorAll("[itemprop]");
            for(i=0; i < prop_fields.length; i++)
            {
                if(prop_fields[i].getAttribute('itemprop')==='employee')
                {
                    var new_emp={name:"", jobTitle:""};
                    var emp_name=prop_fields[i].querySelector("[itemprop='name']"), emp_title=prop_fields[i].querySelector("[itemprop='jobTitle']");
                    if(emp_name!==undefined && emp_name !==null && emp_title!==null && emp_title!==undefined)
                    {
                        new_emp.name=emp_name.innerText;
                        new_emp.jobTitle=emp_title.innerText;
                        result2.employee.push(new_emp);
                    }

                }
                else if(result2[prop_fields[i].getAttribute('itemprop')]!==undefined)
                    {
                        result2[prop_fields[i].getAttribute('itemprop')]=prop_fields[i].innerText;
                        console.log("prop_fields["+i+"].innerText="+prop_fields[i].innerText);
                    }
                    else
                    {
                        console.log("Manta:" +prop_fields[i].getAttribute('itemprop'));
                    }

            }
            if(contact!==null)
            {
                console.log("Found contact");
                var inner_li=contact.getElementsByTagName("li");
                for(i=0; i < inner_li.length; i++)
                {
                    name="";
                    title="";
                    console.log("Manta: i="+i);
                    if(inner_li[i].getAttribute('itemprop')==='employee')
                    {
                        var the_span=inner_li[i].getElementsByTagName("span");
                        for(j=0; j < the_span.length;j++)
                        {
                            if(the_span[j].getAttribute('itemprop')==='name') name=the_span[j].innerText;
                            if(the_span[j].getAttribute('itemprop')==='jobTitle') title=the_span[j].innerText;
                        }
                        if(pres_re.test(title) && !bad_pres_re.test(title))
                        {
                            result["source-url"]=response.finalUrl;
                            var fullname=parse_name_appell(name);
                            result["first-name"]=fullname.fname;
                            result["last-name"]=fullname.lname;
                            result["title"]=title;
                            result.success=true;
                            my_query.success=true;
                            console.log("Manta found "+JSON.stringify(result)+"\nresult2="+JSON.stringify(result2));
                            if(!my_query.submitted)
                            {
                                GM_setValue("submitted",true);
                                my_query.submitted=true;

                                add_to_sheet(result);
                                if(my_query.checking===undefined || my_query.checking===false)
                                {
                                    check_and_submit(check_function,automate);
                                }
                            }
                            return;
                        }
                    }

                }
            }
        }
        catch(error)
        {
            console.log("Manta error "+error);
        }
        console.log("Manta failed");
        my_query.doneManta=true;
        const linkedinPromise = new Promise((resolve, reject) => {
            var search_str="+\""+my_query.short_name+"\" "+my_query.name+" "+my_query.location+" (CEO OR President OR Chief Executive Officer) site:linkedin.com/in";
            console.log("Beginning linkedin search");
            query_search(search_str, resolve, reject,linkedin_response);
        });
    }
