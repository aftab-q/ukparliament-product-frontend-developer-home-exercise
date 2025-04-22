/**
 * Initializes the member component by fetching member details
 * and updating the relevant DOM elements dynamically.
 */
export async function initMemberComponent(): Promise<void> {
  // Define expected API response structure for type safety
  interface Member {
    nameDisplayAs: string;
    thumbnailUrl: string;
    latestParty?: { name: string; backgroundColour: string };
    latestHouseMembership?: { membershipFrom: string; membershipEndDate?: string };
  }

  // Extract the member ID from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");

  // Exit early if member ID is missing
  if (!memberId) {
    console.warn("No member ID provided in the query parameters");
    return;
  }

  // Construct the member-specific API URL
  const apiUrl = `https://members-api.parliament.uk/api/members/${memberId}`;

  // Set up an AbortController for potential request cancellation
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    // Perform the fetch request with abort signal
    const response = await fetch(apiUrl, { signal });

    // Check for unsuccessful response status
    if (!response.ok) {
      console.error(`Fetch failed with status: ${response.status}`);
      return;
    }

    // Parse the JSON response, extracting the member data
    const responseData: { value: Member } = await response.json();
    const member = responseData.value;

    // Find the member card element in the DOM
    const card = document.getElementById("mp-card");
    if (!card) {
      console.warn("Member card element not found");
      return;
    }

    // Apply the party color as a CSS custom property, only if available
    const partyColor = member.latestParty?.backgroundColour;
    if (partyColor) {
      const formattedColor = partyColor.startsWith("#") ? partyColor : `#${partyColor}`;
      document.documentElement.style.setProperty("--party-color", formattedColor);
    }

    // Select child elements for updating member information
    const img = card.querySelector(".mp-card__image") as HTMLImageElement | null;
    const party = card.querySelector(".mp-card__party") as HTMLElement | null;
    const name = card.querySelector(".mp-card__name") as HTMLElement | null;
    const constituency = card.querySelector(".mp-card__constituency") as HTMLElement | null;
    const status = card.querySelector(".mp-card__status") as HTMLElement | null;

    // Update DOM elements with member data, using fallbacks where needed
    if (img) img.src = member.thumbnailUrl ?? "";
    if (party) party.textContent = member.latestParty?.name ?? "N/A";
    if (name) name.textContent = member.nameDisplayAs ?? "N/A";
    if (constituency) constituency.textContent = member.latestHouseMembership?.membershipFrom ?? "N/A";

    // Determine if the membership is currently active
    const membershipEnd = member.latestHouseMembership?.membershipEndDate;
    const isMembershipActive = membershipEnd ? new Date(membershipEnd) > new Date() : true;

    // Show or hide the status message based on membership activity
    if (status) {
      status.style.display = isMembershipActive ? "none" : "block";
      status.textContent = isMembershipActive ? "" : "No longer serving";
    }
  } catch (error) {
    // Handle fetch being aborted or other unexpected errors
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("Fetch request was aborted");
    } else {
      console.error(`Error fetching data for member ID ${memberId}:`, error);
    }
  }
}
