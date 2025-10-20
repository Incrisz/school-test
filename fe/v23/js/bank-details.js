// Bank Details Management
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000/api/v1';

let bankDetails = [];

// Initialize page
$(document).ready(function() {
    loadBankDetails();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    $('#bankDetailForm').on('submit', handleBankDetailSubmit);
}

// Load bank details
async function loadBankDetails() {
    try {
        const response = await makeApiRequest('/fees/bank-details', 'GET');
        bankDetails = response.data;
        renderBankDetails(bankDetails);
    } catch (error) {
        console.error('Error loading bank details:', error);
        $('#bankDetailsTableBody').html(`
            <tr><td colspan="7" class="text-center text-danger">Error loading bank details</td></tr>
        `);
    }
}

// Render bank details table
function renderBankDetails(details) {
    const tbody = $('#bankDetailsTableBody');
    
    if (details.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="7" class="text-center">
                    No bank accounts found. Add your first bank account to start.
                </td>
            </tr>
        `);
        return;
    }
    
    tbody.empty();
    details.forEach(detail => {
        tbody.append(`
            <tr>
                <td>${escapeHtml(detail.bank_name)}</td>
                <td>${escapeHtml(detail.account_name)}</td>
                <td><strong>${escapeHtml(detail.account_number)}</strong></td>
                <td>${detail.branch || '-'}</td>
                <td>
                    <span class="badge bg-${detail.is_active ? 'success' : 'secondary'}">
                        ${detail.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    ${detail.is_default ? '<span class="badge bg-primary"><i class="fas fa-star"></i> Default</span>' : 
                      `<button class="btn btn-sm btn-outline-primary" onclick="setDefaultBank('${detail.id}')">
                          <i class="fas fa-star"></i> Set Default
                       </button>`}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editBankDetail('${detail.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBankDetail('${detail.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

// Show bank detail modal
function showBankDetailModal(detailId = null) {
    $('#bankDetailId').val('');
    $('#bankDetailForm')[0].reset();
    $('#isActive').prop('checked', true);
    $('#isDefault').prop('checked', false);
    $('#bankDetailModalTitle').text('Add Bank Account');
    
    if (detailId) {
        const detail = bankDetails.find(d => d.id === detailId);
        if (detail) {
            $('#bankDetailId').val(detail.id);
            $('#bankName').val(detail.bank_name);
            $('#accountName').val(detail.account_name);
            $('#accountNumber').val(detail.account_number);
            $('#bankCode').val(detail.bank_code || '');
            $('#branch').val(detail.branch || '');
            $('#isDefault').prop('checked', detail.is_default);
            $('#isActive').prop('checked', detail.is_active);
            $('#bankDetailModalTitle').text('Edit Bank Account');
        }
    }
    
    $('#bankDetailModal').modal('show');
}

// Handle bank detail form submission
async function handleBankDetailSubmit(e) {
    e.preventDefault();
    
    const detailId = $('#bankDetailId').val();
    const data = {
        bank_name: $('#bankName').val(),
        account_name: $('#accountName').val(),
        account_number: $('#accountNumber').val(),
        bank_code: $('#bankCode').val() || null,
        branch: $('#branch').val() || null,
        is_default: $('#isDefault').is(':checked'),
        is_active: $('#isActive').is(':checked')
    };
    
    try {
        const method = detailId ? 'PUT' : 'POST';
        const url = detailId ? `/fees/bank-details/${detailId}` : '/fees/bank-details';
        
        await makeApiRequest(url, method, data);
        
        $('#bankDetailModal').modal('hide');
        showAlert(`Bank account ${detailId ? 'updated' : 'added'} successfully`, 'success');
        await loadBankDetails();
    } catch (error) {
        console.error('Error saving bank detail:', error);
        showAlert(error.message || 'Error saving bank account', 'danger');
    }
}

// Edit bank detail
function editBankDetail(detailId) {
    showBankDetailModal(detailId);
}

// Delete bank detail
async function deleteBankDetail(detailId) {
    if (!confirm('Are you sure you want to delete this bank account?')) {
        return;
    }
    
    try {
        await makeApiRequest(`/fees/bank-details/${detailId}`, 'DELETE');
        showAlert('Bank account deleted successfully', 'success');
        await loadBankDetails();
    } catch (error) {
        console.error('Error deleting bank detail:', error);
        showAlert(error.message || 'Error deleting bank account', 'danger');
    }
}

// Set default bank
async function setDefaultBank(detailId) {
    try {
        await makeApiRequest(`/fees/bank-details/${detailId}/set-default`, 'PUT');
        showAlert('Default bank account updated successfully', 'success');
        await loadBankDetails();
    } catch (error) {
        console.error('Error setting default bank:', error);
        showAlert(error.message || 'Error setting default bank account', 'danger');
    }
}

// Utility functions
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('authToken');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
    }
    
    if (method === 'DELETE') {
        return null;
    }
    
    return await response.json();
}

function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('.content-area .container-fluid').prepend(alertHtml);
    
    setTimeout(() => {
        $('.alert').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
