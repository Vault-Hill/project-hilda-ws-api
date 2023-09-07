import json
import requests
import jsonlines
import concurrent.futures
from colorama import Fore
from bs4 import BeautifulSoup
from colorama import init as colorama_init
colorama_init()


# URLs for all content.
ALL_URLS = {
    "data_urls":
    {
        "5G" : "https://www.mtn.ng/5g/",
        "data_plans" : "https://www.mtn.ng/data/data-plans/",
        "router_plans" : "https://www.mtn.ng/broadband/router-plans/",
        "fiber_plans" : "https://www.mtn.ng/broadband/fibre-plans/",
        "data_gifting" : "https://www.mtn.ng/data/data-gifting/",
        "sm_bundles" : "https://www.mtn.ng/data/goodybag-social/",
        "video_streaming_package" : "https://www.mtn.ng/personal/youtube-video-streaming-pack/",
    },
    "devices":
    {
        "broadband_overview" : "https://www.mtn.ng/broadband/",
        "broadband_one_account" : "https://www.mtn.ng/broadband/one-account/",
        "broadband_how_to_guide" : "https://www.mtn.ng/broadband/how-to-guide/",
        "volte" : "https://www.mtn.ng/volte/",
        "device_financing" : "https://www.mtn.ng/device-financing/"
    },
    "voice":
    {
        "beta_talk" : "https://www.mtn.ng/personal/betatalk/",
        "m_pulse" : "https://www.mtn.ng/personal/mpulse/",
        "post_paid" : "https://www.mtn.ng/personal/xtraspecial-postpaid/",
        "yafun_yafun" : "https://www.mtn.ng/personal/yafunyafun/",
        "true_talk" : "https://www.mtn.ng/personal/trutalk/",
        "xtra_value" : "https://www.mtn.ng/personal/xtravalue/",
        "int_calls_sms_rate" : "https://www.mtn.ng/personal/international-rates/",
        "international_roaming" : "https://www.mtn.ng/personal/roaming/",
    },
    "FAQs":
    {
        "data_gifting" : "https://www.mtn.ng/helppersonal/data-gifting/",
        "data_bundles" : "https://www.mtn.ng/helppersonal/data-bundles/",
        "always_on_data" : "https://www.mtn.ng/helppersonal/always-on-data/",
        "hourly_bundle" : "https://www.mtn.ng/helppersonal/hourly-bundle/",
        "family_pack_bundles" : "https://www.mtn.ng/helppersonal/family-pack-bundles/",
        "goodbag_social" : "https://www.mtn.ng/helppersonal/goodybag-social/",
        "data_referral" : "https://www.mtn.ng/helppersonal/data-referral/",
        "youtube_pack" : "https://www.mtn.ng/helppersonal/youtube-video-streaming-pack/",
        "4G_LTE" : "https://www.mtn.ng/helppersonal/4g/",
        "router_plans" : "https://www.mtn.ng/helppersonal/router-plans/",
        "xtravalue_more" : "https://www.mtn.ng/helppersonal/xtravalue-more/",
        "startimes_on" : "https://www.mtn.ng/helppersonal/startimes-on/"
    },
    "leadership":
    {
        "executive_bod" : "https://www.mtn.ng/leadership/?tablink=executive", # Info about executives and BOD can be found here.
    },
    "_15k_huggingface_data" : f"https://datasets-server.huggingface.co/rows?dataset=databricks%2Fdatabricks-dolly-15k&config=default&split=train&offset=0&limit=100"
}


# Error message in event of empty responses.
error_message = "URLIssue: Please check that you provided the right URL to the function.\nIf the issue persiste then it means MTN has made changes to their website structure."


def get_bundle_type_info(url:str, filename = "bundle_training_data", file_format:str = "jsonl", return_file:bool = True) -> str:
    """
    This function scrapes all data regarding mobile bundles on the MTN website and returns them as a string.   

    Input:
        url:str => URL for MTN Mobile Plans page (Under Data).
        filename:str => Filename to store the. snake_case naming convention is encouraged.
        file_format:str => this could be jsonl or txt.
        return_file:bool => Specify if you want the function to return a file or a list.
    Output:
        JSONL file containing questions and answers.
        OR
        list containing all Questions and responses ONLY if return_bool is set to true.
    """

    
    bundle_type_info_jsons_list = [] # list containing questions and answers to be stored in JSONL file format.

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, features="lxml") # Getting HTML response.
        data_plan_cards = soup.find_all("a", {"class" : "_card-deal prepaid-deal"}) # Selection data bundle packages card.

        for plan_detail in data_plan_cards:
            plan = plan_detail.find("h3", {"class" : "_card-deal__title"}).text.strip() # Extracting data plan
            price = (str(plan_detail.find("span", {"class" : "_card-deal__price-currency"}).text.strip()) + 
            str(plan_detail.find("span", {"class" : "_card-deal__price-amount"}).text.strip())) # Extracting plan price
            other_info = plan_detail.find_all("li", {"class" : "deal-feature"})
            other_info_combined = """""" # Extracting info about plan validity period, how to purchase...
            for info in other_info:
                other_info_combined += info.text.strip()+" "

            # Generating questions.
            question_1 = f"I want to buy {plan} of data"
            question_2 = f"How much is the {plan}?"
            question_3 = f"How do I purchase {plan}"
            question_4 = f"To purchase the {plan}, what do I do?"
            question_5 = f"Does MTN have {plan}"
            question_6 = f"Can I buy {plan}?"
            
            # Handling missing purchase info
            if len(other_info_combined.split()) != 4:
                other_info_combined = (other_info_combined.strip().replace('"', "").replace("‘", "").replace("’", "").replace("HR", "")
                .replace("(available on myMTN NG app)", "kindly check our MTN app, it is").replace("Hrs", "hours").replace("hr", " hour(s)"))
            else:
                other_info_combined = "Dial *312#"

            # Generating questions.
            response_1 = f"Alright, to purchase {plan}, at {price}, {other_info_combined}."
            response_2 = f"{plan} cost {price}, {other_info_combined}."
            response_3 = f"To purchase {plan} at {price}, {other_info_combined}."
            response_4 = f"To purchase {plan} which cost {price}, {other_info_combined}."
            response_5 = f"MTN has {plan} seling at {price}, {other_info_combined}."
            response_6 = f"To buy {plan}, {other_info_combined}."
            
            # Generating responses.
            {"instruction": f"{question_1}", "context" : "This question is about an MTN data package", "response": f"{response_1}", "category" : "databundle_qa"}
            bundle_type_info_jsons_list.append({"instruction": f"{question_1}", "context" : "This question is about an MTN data package", "response": f"{response_1}"})
            bundle_type_info_jsons_list.append({"instruction": f"{question_2}", "context" : "This question is about an MTN data package", "response": f"{response_2}"})
            bundle_type_info_jsons_list.append({"instruction": f"{question_3}", "context" : "This question is about an MTN data package", "response": f"{response_3}"})
            bundle_type_info_jsons_list.append({"instruction": f"{question_4}", "context" : "This question is about an MTN data package", "response": f"{response_4}"})
            bundle_type_info_jsons_list.append({"instruction": f"{question_5}", "context" : "This question is about an MTN data package", "response": f"{response_5}"})
            bundle_type_info_jsons_list.append({"instruction": f"{question_6}", "context" : "This question is about an MTN data package", "response": f"{response_6}"})

        # Defining filename.
        filename = filename+"."+file_format
        if return_file:
            if file_format == "jsonl":
                # Writing list of questiona and answers to JSONL file.   
                with open(filename, 'w', encoding="utf-8") as file:
                    for item in bundle_type_info_jsons_list:
                        json.dump(item, file, indent = 2, ensure_ascii = False)
                        file.write("\n\n")
                message = f"{Fore.LIGHTGREEN_EX}Data saved as .jsonl in '{filename}'"
            elif file_format == "txt":
                # Writing list of questiona and answers to TXT file. 
                with open(filename, 'w', encoding="utf-8") as file:
                    for item in bundle_type_info_jsons_list:
                        json.dump(item, file, indent = 2, ensure_ascii = False)
                        file.write("\n\n")
                message = f"{Fore.LIGHTGREEN_EX}Data saved as .txt in '{filename}'"
            elif file_format not in ["jsonl", "txt"]:
                message = "Operation complete.\nIf you expected a file and didn't get any file returned, please check that you specified either filetype 'txt' or 'jsonl', thank you."
        else:
            message = f"{Fore.LIGHTGREEN_EX}Data returned as list"
            return bundle_type_info_jsons_list
        print(message)

    except Exception as e:
        print(f"{Fore.RED}Error encountered with get_bundle_type_info(): \n{Fore.MAGENTA}{e}")


def data_gifting_info(url:str) -> str:
    """
    This function scrapes all data (FAQs excluded) on the data gifting page

    Input:
        url:str => URL for MTN Data Gifting page (Under Data).
    Output:
        info:str => String containing all info of all data gifting page (FAQs excluded)
    """

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, features="lxml")

        all_gifting_info = "" # String containing gifting info and FAQs.
        data_gifting_info = soup.find_all("div", {"class" : "mtn-body-text mtn-section paragraph"})

        # Extracting info on gifting landing page
        for content in data_gifting_info:
            all_gifting_info += content.text.replace("\n", " ").strip()

        # Raising exception in event of empty string.
        if len(all_gifting_info) == 0:
            raise Exception(error_message)
        else:
            return all_gifting_info
    except Exception as e:
        print(f"{Fore.RED}Error encountered with data_gifting_info(): \n{Fore.MAGENTA}{e}")


def get_FAQs(url:str, filename:str = "FAQs_training_data", file_format:str = "jsonl", return_file:bool = True):
    """
    This function takes in the URL to the particular FAQs page and returns a tule containing   
    two lists One containing all FAQs and the other containing all responses to the FAQs.
    
    Input:
        url:str => URL for MTN Data Gifting page (Under Data).
        filename:str => Filename to store the. snake_case naming convention is encouraged.
        file_format:str => this could be jsonl or txt.
        return_file:bool => Specify if you want the function to return a file or a list.
    Output:
        JSONL file containing questions and answers.
        OR
        list containing all Questions and responses ONLY if return_bool is set to true.
    """
    try:
        FAQs_jsons_list = [] # list containing questions and answers to be stored in JSONL file format.
        response = requests.get(url)
        soup = BeautifulSoup(response.content, features="lxml")

        FAQs = soup.find_all("span", {"class" : "accordion-title"})
        responses = soup.find_all("div", {"class" : "panel"})

        for question, response in zip(FAQs, responses):
            question = question.text.strip()
            response = response.text.strip()[3:].replace('  ', ' ').replace("\n\n", " ")
            FAQs_jsons_list.append({"instruction": f"{question}", "context" : "This question is a frequently asked question by MTN users", "response": f"{response}"})

        # Raise exception if lists are empty, meaning URL has an issue.
        if len(FAQs_jsons_list) == 0:
            raise Exception(error_message)
        else:
            # Defining filename.
            filename = filename+"."+file_format
            if return_file:
                if file_format == "jsonl":
                    # Writing list of questiona and answers to JSONL file.   
                    with open(filename, 'w', encoding="utf-8") as file:
                        for item in FAQs_jsons_list:
                            json.dump(item, file, indent = 2, ensure_ascii = False)
                            file.write("\n\n")
                    message = f"{Fore.LIGHTGREEN_EX}Data saved as .jsonl in '{filename}'"
                elif file_format == "txt":
                    # Writing list of questiona and answers to TXT file. 
                    with open(filename, 'w', encoding="utf-8") as file:
                        for item in FAQs_jsons_list:
                            json.dump(item, file, indent = 2, ensure_ascii = False)
                            file.write("\n\n")
                    message = f"{Fore.LIGHTGREEN_EX}Data saved as .txt in '{filename}'"
                elif file_format not in ["jsonl", "txt"]:
                    message = "Operation complete.\nIf you expected a file and didn't get any file returned, please check that you specified either filetype 'txt' or 'jsonl', thank you."
                else:
                    message = f"{Fore.LIGHTGREEN_EX}Data returned as list"
                    return FAQs_jsons_list
                print(message)
            else:
                message = f"{Fore.LIGHTGREEN_EX}Data returned as list"
                print(message)
                return FAQs_jsons_list

    except Exception as e:
        print(f"{Fore.RED}Error encountered with get_FAQs(): \n{Fore.MAGENTA}{e}")


def get_executive_committee(url:str, filename = "executive_committee", file_format:str = "jsonl", return_file:bool = True):
    """
    This function gets details about each member of the executive arm of MTN
    Input:
        url:str => URL for MTN Mobile Plans page (Under Data).
        filename:str => Filename to store the. snake_case naming convention is encouraged.
        file_format:str => this could be jsonl or txt.
        return_file:bool => Specify if you want the function to return a file or a list.
    Output:
        returns jsonl file containing questions and answers regarding executives in MTN.
        OR
        list containing all Questions and responses ONLY if return_bool is set to true.
    """
    
    response = requests.get(url)
    soup = BeautifulSoup(response.content, features="lxml")

    position_name_dict = {} # Dictionary containing names and positions
    names = [name.text for name in soup.find_all("h5")] # Extracting names of officers from the MTN website
    positions = [position.text for position in soup.find_all("div", {"class" : "leader-designation"})] # Extracting offices/positions.
    executive_committee_jsons_list = [] # list containing questions and answers to be stored in JSONL file format.

    # Checking for multiple individuals with same role and formating data accordingly
    for name, position in zip(names, positions):
        if position_name_dict.get(position) == None: # Checking if the role exists in the dataset already
            position_name_dict[position] = [name] # Creating list of names for a particular position if it doesn't exist
        else:
            position_name_dict[position].append(name) # Adding new name to list of already existing names for that position. 


    # Generating questions responses bearing in mind that certain positions have multiple individuals. 
    for position in position_name_dict.keys():
        if len(position_name_dict[position]) == 1: # Position held by only one person.
            name = position_name_dict[position][0] # Extracting name of officer from dictionary
            # Generating questions.
            question_1 = f"Who is the {position} of MTN?"
            question_2 = f"MTNs {position} is called?"
            question_3 = f"What is the name of MTNs {position}"

            # Generating responses to questions.
            response_1 = f"The current {position} of MTN is {name}"
            response_2 = f"The current {position} of MTN is called {name}"
            response_3 = f"The name of the current {position} of MTN is {name}"

            # Generating JSON data template and appending to list of Q&A
            executive_committee_jsons_list.append({"instruction": f"{question_1}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_1}"})
            executive_committee_jsons_list.append({"instruction": f"{question_2}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_2}"})
            executive_committee_jsons_list.append({"instruction": f"{question_3}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_3}"})
        else: # Handling positions that have multiple individuals.
            position_names = ", ".join(position_name_dict[position]) # Converting individual names into a string
            num_in_position = len(position_name_dict[position]) # Number of people currently holding the position.

            # Generating questions.
            question_1 = f"Who is the {position} of MTN?"
            question_2 = f"MTNs {position} is called?"
            question_3 = f"What is the name of MTNs {position}"
            question_4 = f"Who are the {position}s of MTN?"
            question_5 = f"MTNs {position}s are called?"
            question_6 = f"What are the name of MTNs {position}s"

            # Generating responses to questions.
            response_1 = f"The current {position}s of MTN are {position_names}"
            response_2 = f"Currently, there are {num_in_position} {position}s {position_names}"
            response_3 = f"The names of the current {position}s of MTN are {position_names}"
            response_4 = f"The current {position}s of MTN are {position_names}"
            response_5 = f"Currently, there are {num_in_position} {position}s {position_names}"
            response_6 = f"The names of the {num_in_position} {position}s of MTN are {position_names}"

            # Generating JSON data template and appending to list of Q&A
            executive_committee_jsons_list.append({"instruction": f"{question_1}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_1}"})
            executive_committee_jsons_list.append({"instruction": f"{question_2}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_2}"})
            executive_committee_jsons_list.append({"instruction": f"{question_3}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_3}"})
            executive_committee_jsons_list.append({"instruction": f"{question_4}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_4}"})
            executive_committee_jsons_list.append({"instruction": f"{question_5}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_5}"})
            executive_committee_jsons_list.append({"instruction": f"{question_6}", "context" : "This question is about members of the leadership board of MTN.", "response": f"{response_6}"})
    
    # Defining filename.
    filename = filename+"."+file_format
    if return_file:
        if file_format == "jsonl":
            # Writing list of questiona and answers to JSONL file.   
            with open(filename, 'w', encoding="utf-8") as file:
                for item in executive_committee_jsons_list:
                    json.dump(item, file, indent = 2, ensure_ascii = False)
                    file.write("\n\n")
            message = f"{Fore.LIGHTGREEN_EX}Data saved as .jsonl in '{filename}'"
        elif file_format == "txt":
            # Writing list of questiona and answers to TXT file. 
            with open(filename, 'w', encoding="utf-8") as file:
                for item in executive_committee_jsons_list:
                    json.dump(item, file, indent = 2, ensure_ascii = False)
                    file.write("\n\n")
            message = f"{Fore.LIGHTGREEN_EX}Data saved as .txt in '{filename}'"
        elif file_format not in ["jsonl", "txt"]:
            message = "Operation complete.\nIf you expected a file and didn't get any file returned, please check that you specified either filetype 'txt' or 'jsonl', thank you."
    else:
        message = f"{Fore.LIGHTGREEN_EX}Data returned as list"
        return executive_committee_jsons_list

    if len(names) | len(positions) == 0: # Checking if any data was succesfully scraped.
        print(f"{Fore.RED}Error encountered with get_executive_committee():\n{Fore.MAGENTA}Check that the url provided is correct, if error persists then MTN has made changes to their website")
    else:
        # Confirmation message.
        print(message)


def get_15k_dataset(return_file:bool = False, filename:str = "huggingface_15k", file_format:str = "jsonl"):
    """
    This function makes GET requests to collect JSON training dataset from huggingface API.

    Input:
        filename:str => Filename to store the JSONL dataset as. snake_case.jsonl naming convention is encouraged.
        return_file:bool => Specify if you want the function to return a file or a list.
        file_format: speciy jsonl or txt
    Output:
        returns jsonl/txt file containing all datafrom huggingface.
        OR
        list containing all Questions and responses ONLY if return_bool is set to true.
    """

    # Getting additional 15k training dataset from .
    _15k_dataset_list = [] # list containing 15k dataset.
    start = 0 # offset value for containing first 100 rows of data.
    stop = 15100 # offset value of last few rows of data.
    step = 100

    try:
        _15k_dataset_list = [] # List containing 

        for i in range(start, stop, step):
            url = f"https://datasets-server.huggingface.co/rows?dataset=databricks%2Fdatabricks-dolly-15k&config=default&split=train&offset={i}&limit=100%22"

            data = requests.get(url)
            content_json = data.json()

            for row in content_json["rows"]:
                _15k_dataset_list.append({"instruction": row["row"]["instruction"], "context" : row["row"]["context"], "response" : row["row"]["response"]})

        # Defining filename.
        filename = filename+"."+file_format
        if return_file:
            if file_format == "jsonl":
                # Writing list of questiona and answers to JSONL file.   
                with open(filename, 'w', encoding="utf-8") as file:
                    for item in _15k_dataset_list:
                        json.dump(item, file, indent = 2, ensure_ascii = False)
                        file.write("\n\n")
                message = f"{Fore.LIGHTGREEN_EX}Data saved as .jsonl in '{filename}'"
            elif file_format == "txt":
                # Writing list of questiona and answers to TXT file. 
                with open(filename, 'w', encoding="utf-8") as file:
                    for item in _15k_dataset_list:
                        json.dump(item, file, indent = 2, ensure_ascii = False)
                        file.write("\n\n")
                message = f"{Fore.LIGHTGREEN_EX}Data saved as .txt in '{filename}'"
            elif file_format not in ["jsonl", "txt"]:
                message = "Operation complete.\nIf you expected a file and didn't get any file returned, please check that you specified either filetype 'txt' or 'jsonl', thank you."
        else:
            message = f"{Fore.LIGHTGREEN_EX}Data returned as list"
            return _15k_dataset_list
    
    except Exception as e:
        raise Exception(f"{Fore.RED}Error encountered with get_15k_dataset function\ne")


def get_all_questions_and_responses(return_file:bool = True, filename:str = "train", file_format = "jsonl"):
    """
    This function calls all scraper functions with the appropriate URLs and returns collection of JSONL datasets received from them.
    Input:
        filename:str => Filename to store the JSONL dataset as. snake_case.jsonl naming convention is encouraged.
        return_file:bool => Specify if you want the function to return a file or a list.
        file_format: speciy jsonl or txt
    Output:
        returns jsonl file containing all training/finetuning questions and answers.
        OR
        list containing all Questions and responses ONLY if return_bool is set to true.
    """

    # Create a ThreadPoolExecutor with 2 threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        # Submit tasks for data bundles
        # get_bundle_type_info(ALL_URLS["data_urls"]["data_plans"], "data", "jsonl", True)
        data_plans_future = executor.submit(get_bundle_type_info, ALL_URLS["data_urls"]["data_plans"], "data", "jsonl", False)
        router_plans_future = executor.submit(get_bundle_type_info, ALL_URLS["data_urls"]["router_plans"], "data", "jsonl", False)
        fiber_plans_future = executor.submit(get_bundle_type_info, ALL_URLS["data_urls"]["fiber_plans"], "data", "jsonl", False)
        sm_bundles_future = executor.submit(get_bundle_type_info, ALL_URLS["data_urls"]["sm_bundles"], "data", "jsonl", False)
        video_streaming_future = executor.submit(get_bundle_type_info, ALL_URLS["data_urls"]["video_streaming_package"], "data", "jsonl", False)

        # Submit tasks for FAQs
        # get_FAQs(ALL_URLS["FAQs"]["data_gifting"], "faq", "jsonl", True)
        data_gifting_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["data_gifting"], "faq", "jsonl", False)
        data_bundles_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["data_bundles"], "faq", "jsonl", False)
        always_on_data_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["always_on_data"], "faq", "jsonl", False)
        hourly_bundle_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["hourly_bundle"], "faq", "jsonl", False)
        family_pack_bundles_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["family_pack_bundles"], "faq", "jsonl", False)
        goodbag_social_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["goodbag_social"], "faq", "jsonl", False)
        data_referral_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["data_referral"], "faq", "jsonl", False)
        youtube_pack_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["youtube_pack"], "faq", "jsonl", False)
        _4G_LTE_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["4G_LTE"], "faq", "jsonl", False)
        router_plans_faq_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["router_plans"], "faq", "jsonl", False)
        xtravalue_more_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["xtravalue_more"], "faq", "jsonl", False)
        startimes_on_future = executor.submit(get_FAQs, ALL_URLS["FAQs"]["startimes_on"], "faq", "jsonl", False)

        # Submit task for executive committee
        # get_executive_committee(ALL_URLS["leadership"]["executive_bod"], "text", "jsonl", True)
        leadership_future = executor.submit(get_executive_committee, ALL_URLS["leadership"]["executive_bod"], "text", "jsonl", False)

        # Submit task for 15K huggingface dataset.
        # get_15k_dataset(return_file:bool = False, filename:str = "huggingface_15k", file_format:str = "jsonl")
        _15k_dataset_list = executor.submit(get_15k_dataset, False, "huggingface_15k", "jsonl")

        # Retrieve the results when they are ready
        data_plans_result = data_plans_future.result()
        router_plans_result = router_plans_future.result()
        fiber_plans_result = fiber_plans_future.result()
        sm_bundles_result = sm_bundles_future.result()
        video_streaming_result = video_streaming_future.result()

        data_gifting_result = data_gifting_future.result()
        data_bundles_result = data_bundles_future.result()
        always_on_data_result = always_on_data_future.result()
        hourly_bundle_result = hourly_bundle_future.result()
        family_pack_bundles_result = family_pack_bundles_future.result()
        goodbag_social_result = goodbag_social_future.result()
        data_referral_result = data_referral_future.result()
        youtube_pack_result = youtube_pack_future.result()
        _4G_LTE_result = _4G_LTE_future.result()
        router_plans_faq_result = router_plans_faq_future.result()
        xtravalue_more_result = xtravalue_more_future.result()
        startimes_on_result = startimes_on_future.result()

        leadership_result = leadership_future.result()

        # Explain delay
        print(f"{Fore.WHITE}Now working on 15k Huggingface dataset.")
        _15k_dataset_list_result = _15k_dataset_list.result()


    # Combining all datasets.
    train_array = (data_plans_result + router_plans_result + fiber_plans_result +
                   sm_bundles_result + video_streaming_result + data_gifting_result +
                   data_bundles_result + always_on_data_result + hourly_bundle_result +
                   family_pack_bundles_result + goodbag_social_result + data_referral_result +
                   youtube_pack_result + _4G_LTE_result + router_plans_faq_result + xtravalue_more_result +
                   startimes_on_result + leadership_result + _15k_dataset_list_result)


    # Defining filename.
    filename = filename+"."+file_format
    if return_file:
        if file_format == "jsonl":
            # Writing list of questiona and answers to JSONL file.   
            with open(filename, 'w', encoding="utf-8") as file:
                # Writing MTN data to file JSONL file
                for item in train_array:
                    json.dump(item, file, indent = 2, ensure_ascii = False)
                    file.write("\n\n")
            message = f"{Fore.LIGHTGREEN_EX}Data saved as .jsonl in '{filename}'"
        elif file_format == "txt": 
            with open(filename, 'w', encoding="utf-8") as file:
                # Writing MTN data to TXT file.
                for item in train_array:
                    json.dump(item, file, indent = 2, ensure_ascii = False)
                    file.write("\n\n")
            message = f"{Fore.LIGHTGREEN_EX}Data saved as .txt in '{filename}'"
        elif file_format not in ["jsonl", "txt"]:
            message = "Operation complete.\nIf you expected a file and didn't get any file returned, please check that you specified either filetype 'txt' or 'jsonl', thank you."
        print(message)
    else:
        message = f"{Fore.LIGHTGREEN_EX}Data returned as list"
        print(message)
        return train_array
 

get_all_questions_and_responses(return_file = True, file_format = "txt")