import fetch from 'node-fetch';

const ENDPOINT = 'https://leetcode.com/graphql'; 
const CONTENT_TYPE = 'application/json';
const REFERER = 'https://leetcode.com/';

async function fetchUserSubmissions(username, authCookie, limit) {

  try {
    const submissionsResponse = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE,
        'Referer': REFERER, 
      },
      body: JSON.stringify({
        query: `
          query($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
              id
              title
              titleSlug
              timestamp
            }
          }
        `,
        variables: { username, limit },
      }),
    });

    if (!submissionsResponse.ok) {
      throw new Error('Failed to fetch recent submissions');
    }

    const response = await submissionsResponse.json();
    const submissions = response.data.recentAcSubmissionList;

    // Concurrently fetch requests
    const results = await Promise.all(submissions.map(async submission => {
      const submissionCode = await fetchSubmissionCode(submission.id,authCookie);
      const question = await fetchDifficulty(submission.titleSlug)
      if (submissionCode) {
        return {
          id: submission.id,
          title: submission.title,
          titleSlug : submission.titleSlug,
          timestamp: submission.timestamp,
          code: submissionCode.code, 
          lang: submissionCode.lang.name,
          difficulty: question.difficulty
        };
      }
      return null;
    }));

    return results;
  } catch (error) {
    console.error(error.message);
    return null; 
  }
}

async function fetchDifficulty(titleSlug) {
  try {
    const difficultResponse = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE,
        'Referer': REFERER, 
      },
      body: JSON.stringify({
        query: `
          query questionTitle($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              difficulty
            }
          }
        `,
        variables: { titleSlug: titleSlug },
      }),
    });

    if (!difficultResponse.ok) {
      const errorData = await difficultResponse.json();
      console.error("Error fetching difficult level:", errorData);
      throw new Error(`Failed to fetch difficult level for ${titleSlug}`);
    }

    const difficult = await difficultResponse.json(); 
    return difficult.data.question;
  } catch (error) {
    console.error(error.message);
    return null; 
  }
}

async function fetchSubmissionCode(submissionId, authCookie) {
  try {
    const submissionDetailsResponse = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE,
        'Referer': REFERER, 
        'Cookie': `LEETCODE_SESSION=${authCookie}`,
      },
      body: JSON.stringify({
        query: `
          query($submissionId: Int!) {
            submissionDetails(submissionId: $submissionId) {
              code
              lang {
                name
              }
              timestamp
            }
          }
        `,
        variables: { submissionId: submissionId },
      }),
    });

    if (!submissionDetailsResponse.ok) {
      const errorData = await submissionDetailsResponse.json();
      console.error("Error fetching submission details:", errorData);
      throw new Error(`Failed to fetch submission details for ID: 
        ${submissionId}`);
    }
    const submissionDetailsData = await submissionDetailsResponse.json(); 
    return submissionDetailsData.data.submissionDetails;

  } catch (error) {
    console.error(error.message);
    return null; 
  }
}

export default fetchUserSubmissions;
