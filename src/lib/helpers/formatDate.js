export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
}

export function calculateTimeLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;
  
    if (timeDiff <= 0) {
      return '0 days left';
    }
  
    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
    if (daysLeft > 0) {
      return `${daysLeft} days left`;
    } else {
      return `${hoursLeft} hours ${minutesLeft} minutes left`;
    }
}