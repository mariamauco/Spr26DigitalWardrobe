#use a prompt:sort embeddings using the style for a specific wheather condition
#users preferences of style tags
#other preferences such as: silhoutte, what they prefer for the bottoms such as skirts/ shorts/ pants/ jeans
#integer values: how okay are the users with trying something outside of their preferences
#how likely are they to wear something that doesnt perfectly match what they want -> look at the upload image route
#based on their confidence level
#include edge cases where the users do not have everything needed

#import fine tuned fashion clip

#make an instance of it

#use the fine-tuned version of fashion clip to create outfits based on style that its asked for

#depending on the wheather API tags returned, we will return the best item for each category
def pick_first_best(items, used_ids):
    """Return the first item not already used, or None."""
    #implement logic for weather tag and style 
    for item in items:
        if item["_id"] not in used_ids:
            return item
    return None

def pick_second_best(items, used_ids):
    """Return the second item not already used, or None."""
    #implement logic for weather tag and style
    for item in items:
        if item["_id"] not in used_ids:
            return item
    return None

def pick_third_best(items, used_ids):
    #implement logic for weather tag and style
    """Return the third item not already used, or None."""
    for item in items:
        if item["_id"] not in used_ids:
            return item
    return None

#give three reccommendations based on the three
def assemble_outfits(ranked_groups, max_outfits=3):
    """Build up to 3 outfits from ranked item groups, no item reuse."""
    outfits = []
    used_ids = set()

    for _ in range(max_outfits):
        top = pick_best(ranked_groups["top"], used_ids)
        bottom = pick_best(ranked_groups["bottom"], used_ids)
        footwear = pick_best(ranked_groups["footwear"], used_ids)
        onepiece = pick_best(ranked_groups["one-piece"], used_ids)

        # try top + bottom + footwear, or one-piece + footwear
        if top and bottom and footwear:
            outfit = {
                "top": top["_id"],
                "bottom": bottom["_id"],
                "footwear": footwear["_id"],
            }
            used_ids.update([top["_id"], bottom["_id"], footwear["_id"]])
        elif onepiece and footwear:
            outfit = {
                "top": onepiece["_id"],
                "bottom": None,
                "footwear": footwear["_id"],
            }
            used_ids.update([onepiece["_id"], footwear["_id"]])
        else:
            break  # not enough items for a valid outfit

        # add optional pieces
        outerwear = pick_best(ranked_groups["outerwear"], used_ids)
        accessory = pick_best(ranked_groups["accessories"], used_ids)

        outfit["outerwear"] = outerwear["_id"] if outerwear else None
        outfit["accessories"] = accessory["_id"] if accessory else None

        if outerwear:
            used_ids.add(outerwear["_id"])
        if accessory:
            used_ids.add(accessory["_id"])

        outfits.append(outfit)

    return outfits
